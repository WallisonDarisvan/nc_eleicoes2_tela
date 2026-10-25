// Serviço de malhas e nomes oficiais de municípios via IBGE e dados oficiais do TSE para nível 3 do mapa
import type { UF } from '../types/election';
import { getElectionCode } from './tseService';
import { saveGenericDataToDb, getGenericDataFromDb } from './imageDbService';
import { UFS_INFO } from '../data/regionsAndUfs';

export interface MunicipalityCandidateDetail {
  name: string;
  n: string;
  leader: 'LULA' | 'BOLSONARO';
  color: string;
  pvap: number;
  vap: number;
}

export interface MunicipalityPath {
  id: string; // Código IBGE (ex: 3300100)
  nome: string;
  d: string;
  leader?: 'LULA' | 'BOLSONARO' | 'NONE';
  color?: string;
  pvap?: number;
  vap?: number;
  pst?: number;
  totalValidos?: number;
  cand1?: MunicipalityCandidateDetail;
  cand2?: MunicipalityCandidateDetail;
}

export interface StateMunicipalityData {
  uf: UF;
  viewBox: string;
  municipalities: MunicipalityPath[];
}

interface TseMunicipalResult {
  leader: 'LULA' | 'BOLSONARO' | 'NONE';
  color: string;
  pvap: number;
  vap: number;
  pst: number;
  totalValidos?: number;
  cand1?: MunicipalityCandidateDetail;
  cand2?: MunicipalityCandidateDetail;
}

interface TseMunConfigItem {
  cd: string;
  cdi: string;
  nm: string;
}

interface CachedIbgeMesh {
  uf: UF;
  viewBox: string;
  rawPaths: Array<{ id: string; nome: string; d: string }>;
}

const memoryCache: Partial<Record<UF, StateMunicipalityData>> = {};
const inFlightPrefetch = new Set<UF>();
let tseMunConfigPromise: Promise<Record<string, TseMunConfigItem[]>> | null = null;

/**
 * Obtém o arquivo de configuração oficial do TSE que correlaciona o código IBGE (cdi) com o código TSE (cd)
 * Armazenado em memória e no IndexedDB para download único em toda a sessão
 */
async function getTseMunConfigMap(): Promise<Record<string, TseMunConfigItem[]>> {
  if (tseMunConfigPromise) return tseMunConfigPromise;

  tseMunConfigPromise = (async () => {
    const cacheKey = 'tse_config_mun_map_v1';
    const cached = await getGenericDataFromDb<Record<string, TseMunConfigItem[]>>(cacheKey);
    if (cached && Object.keys(cached).length > 0) {
      return cached;
    }

    const electionCode = getElectionCode('PRESIDENTE');
    const primaryUrl = `/tse-api/oficial/ele2026/${electionCode}/config/mun-e00${electionCode}-cm.json`;
    const directUrl = `https://resultados.tse.jus.br/oficial/ele2026/${electionCode}/config/mun-e00${electionCode}-cm.json`;

    try {
      let res: Response;
      try {
        res = await fetch(primaryUrl);
        if (!res.ok) throw new Error('Proxy fail');
      } catch {
        res = await fetch(directUrl);
      }
      if (!res.ok) return {};
      const data = await res.json();
      const map: Record<string, TseMunConfigItem[]> = {};
      if (Array.isArray(data.abr)) {
        data.abr.forEach((a: any) => {
          const ufUpper = (a.cd || '').toUpperCase();
          if (ufUpper && Array.isArray(a.mu)) {
            map[ufUpper] = a.mu;
          }
        });
      }
      saveGenericDataToDb(cacheKey, map).catch(() => {});
      return map;
    } catch (err) {
      console.warn('Erro ao carregar mapa de municípios do TSE:', err);
      return {};
    }
  })();

  return tseMunConfigPromise;
}

/**
 * Busca e projeta a malha geográfica vetorial do IBGE com cache persistente no IndexedDB
 */
async function getOrFetchIbgeMesh(uf: UF): Promise<CachedIbgeMesh | null> {
  const meshDbKey = `ibge_mesh_v2_${uf}`;

  // 1. Tenta carregar do IndexedDB (0ms de rede)
  const cachedDbMesh = await getGenericDataFromDb<CachedIbgeMesh>(meshDbKey);
  if (cachedDbMesh && cachedDbMesh.rawPaths && cachedDbMesh.rawPaths.length > 0) {
    return cachedDbMesh;
  }

  // 2. Se não existir no cache local, busca do IBGE
  try {
    const [meshRes, namesRes] = await Promise.all([
      fetch(
        `https://servicodados.ibge.gov.br/api/v3/malhas/estados/${uf}?formato=application/vnd.geo+json&qualidade=minima&intrarregiao=municipio`
      ),
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`),
    ]);

    if (!meshRes.ok) return null;
    const geojson = await meshRes.json();
    const namesList: Array<{ id: number; nome: string }> = namesRes.ok ? await namesRes.json() : [];

    const namesMap = new Map<string, string>();
    namesList.forEach((m) => {
      namesMap.set(String(m.id), m.nome);
    });

    // Calcula os limites de longitude e latitude do estado
    let minLon = Infinity,
      maxLon = -Infinity,
      minLat = Infinity,
      maxLat = -Infinity;

    function visitCoords(coords: any) {
      if (typeof coords[0] === 'number') {
        const [lon, lat] = coords;
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      } else if (Array.isArray(coords)) {
        coords.forEach(visitCoords);
      }
    }

    // Tratamento especial para Fernando de Noronha em Pernambuco
    if (uf === 'PE') {
      const origCenterLon = -32.42785;
      const origCenterLat = -3.8615;
      const targetCenterLon = -34.35;
      const targetCenterLat = -7.55;
      const scale = 4.0;

      function transformNoronha(coords: any): any {
        if (typeof coords[0] === 'number') {
          const [lon, lat] = coords;
          const newLon = targetCenterLon + (lon - origCenterLon) * scale;
          const newLat = targetCenterLat + (lat - origCenterLat) * scale;
          return [newLon, newLat];
        } else if (Array.isArray(coords)) {
          return coords.map(transformNoronha);
        }
        return coords;
      }

      geojson.features?.forEach((f: any) => {
        const id = String(f.properties?.codarea || f.id || '');
        if (id === '2605459') {
          f.geometry.coordinates = transformNoronha(f.geometry.coordinates);
        }
      });
    }

    if (!geojson.features || geojson.features.length === 0) return null;
    geojson.features.forEach((f: any) => visitCoords(f.geometry.coordinates));

    const avgLat = ((minLat + maxLat) / 2) * (Math.PI / 180);
    const cosLat = Math.cos(avgLat);
    const targetW = 900;
    const factor = targetW / ((maxLon - minLon) * cosLat || 1);
    const targetH = Math.round((maxLat - minLat) * factor);
    const pad = 30;

    function project([lon, lat]: [number, number]): [number, number] {
      const x = Math.round(((lon - minLon) * cosLat * factor + pad) * 10) / 10;
      const y = Math.round(((maxLat - lat) * factor + pad) * 10) / 10;
      return [x, y];
    }

    function ringToPath(ring: [number, number][]): string {
      return ring
        .map((pt, i) => {
          const [x, y] = project(pt);
          return (i === 0 ? 'M' : 'L') + x + ' ' + y;
        })
        .join(' ') + ' Z';
    }

    function geomToPath(geom: any): string {
      if (geom.type === 'Polygon') {
        return geom.coordinates.map(ringToPath).join(' ');
      } else if (geom.type === 'MultiPolygon') {
        return geom.coordinates.map((poly: any) => poly.map(ringToPath).join(' ')).join(' ');
      }
      return '';
    }

    const rawPaths = geojson.features.map((f: any) => {
      const id = String(f.properties?.codarea || f.id || '');
      const nome = namesMap.get(id) || `Município ${id}`;
      const d = geomToPath(f.geometry);
      return { id, nome, d };
    });

    const meshData: CachedIbgeMesh = {
      uf,
      viewBox: `0 0 ${targetW + pad * 2} ${targetH + pad * 2}`,
      rawPaths,
    };

    // Salva no IndexedDB para carregamentos futuros instantâneos
    saveGenericDataToDb(meshDbKey, meshData).catch(() => {});
    return meshData;
  } catch (err) {
    console.error(`Erro ao carregar malha do IBGE para ${uf}:`, err);
    return null;
  }
}

/**
 * Busca os votos municipais do TSE aplicando cache persistente com cuidado cirúrgico:
 * - Municípios com 100% apurados (pst >= 100) são salvos definitivamente e NUNCA mais requisitados na rede.
 * - Municípios com pst < 100 utilizam SWR e são atualizados em segundo plano.
 */
async function fetchTseMunicipalResultsForUf(
  uf: UF,
  onProgress?: (interimVotes: Record<string, TseMunicipalResult>) => void
): Promise<Record<string, TseMunicipalResult>> {
  const votesDbKey = `tse_votes_mun_${uf}`;
  const cachedVotes = (await getGenericDataFromDb<Record<string, TseMunicipalResult>>(votesDbKey)) || {};

  const electionCode = getElectionCode('PRESIDENTE');
  const munConfigMap = await getTseMunConfigMap();
  const ufMus = munConfigMap[uf.toUpperCase()] || [];

  if (ufMus.length === 0) return cachedVotes;

  // Filtra municípios que ainda necessitam de apuração na rede (pst < 100 ou não baixados ainda)
  // Municípios que já atingiram 100% são pulados imediatamente!
  const toFetch = ufMus.filter((m) => {
    const existing = cachedVotes[m.cdi];
    return !existing || existing.pst < 100;
  });

  // Se todos os municípios já estiverem 100% apurados, não gasta nenhuma requisição de rede!
  if (toFetch.length === 0) {
    return cachedVotes;
  }

  // Priorização da capital e municípios principais nos primeiros lotes
  const capitalName = UFS_INFO[uf]?.capital?.toLowerCase();
  if (capitalName) {
    toFetch.sort((a, b) => {
      const aIsCap = (a.nm || '').toLowerCase() === capitalName;
      const bIsCap = (b.nm || '').toLowerCase() === capitalName;
      if (aIsCap && !bIsCap) return -1;
      if (!aIsCap && bIsCap) return 1;
      return 0;
    });
  }

  const ufLower = uf.toLowerCase();
  const results: Record<string, TseMunicipalResult> = { ...cachedVotes };

  // Fila contínua com 24 requisições simultâneas em pipeline contínuo
  const CONCURRENCY_LIMIT = 24;
  let cursor = 0;
  let lastProgressCall = Date.now();
  let pendingProgressTimer: any = null;

  // Atualização progressiva da tela a cada ~250ms conforme os municípios vão sendo baixados
  const triggerProgress = (force = false) => {
    if (!onProgress) return;
    const now = Date.now();
    if (force || now - lastProgressCall >= 250) {
      if (pendingProgressTimer) {
        clearTimeout(pendingProgressTimer);
        pendingProgressTimer = null;
      }
      lastProgressCall = now;
      onProgress({ ...results });
    } else if (!pendingProgressTimer) {
      pendingProgressTimer = setTimeout(() => {
        pendingProgressTimer = null;
        lastProgressCall = Date.now();
        onProgress({ ...results });
      }, 250);
    }
  };

  async function worker() {
    while (cursor < toFetch.length) {
      const idx = cursor++;
      const m = toFetch[idx];
      if (!m) break;

      const primaryUrl = `/tse-api/oficial/ele2026/${electionCode}/dados/${ufLower}/${ufLower}${m.cd}-c0001-e00${electionCode}-u.json`;
      const directUrl = `https://resultados.tse.jus.br/oficial/ele2026/${electionCode}/dados/${ufLower}/${ufLower}${m.cd}-c0001-e00${electionCode}-u.json`;

      try {
        let res: Response;
        try {
          res = await fetch(primaryUrl);
          if (!res.ok) throw new Error('Proxy fail');
        } catch {
          res = await fetch(directUrl);
        }
        if (!res.ok) continue;

        const json = await res.json();
        const pst = parseFloat((json.s?.pst || '0').replace(',', '.')) || 0;
        const cands = json.carg?.[0]?.agr?.flatMap((a: any) => a.par?.flatMap((p: any) => p.cand || []) || []) || [];

        const candLula = cands.find((c: any) => c.n === '13');
        const candFlavio = cands.find((c: any) => c.n === '22');

        const lulaVap = parseInt(candLula?.vap || '0', 10);
        const flavioVap = parseInt(candFlavio?.vap || '0', 10);
        const lulaPvap = parseFloat((candLula?.pvap || '0').replace(',', '.')) || 0;
        const flavioPvap = parseFloat((candFlavio?.pvap || '0').replace(',', '.')) || 0;

        const totalValidos = parseInt(json.v?.vvc || json.v?.tv || '0', 10) || (lulaVap + flavioVap);

        const lulaDetail: MunicipalityCandidateDetail = {
          name: 'Lula',
          n: '13',
          leader: 'LULA',
          color: '#CC0000',
          pvap: lulaPvap,
          vap: lulaVap,
        };

        const flavioDetail: MunicipalityCandidateDetail = {
          name: 'Flávio',
          n: '22',
          leader: 'BOLSONARO',
          color: '#12B24B',
          pvap: flavioPvap,
          vap: flavioVap,
        };

        let leader: 'LULA' | 'BOLSONARO' | 'NONE' = 'NONE';
        let color = '#243B5A';
        let pvap = 0;
        let vap = 0;
        let cand1: MunicipalityCandidateDetail | undefined;
        let cand2: MunicipalityCandidateDetail | undefined;

        if (lulaVap > flavioVap) {
          leader = 'LULA';
          color = '#CC0000';
          pvap = lulaPvap;
          vap = lulaVap;
          cand1 = lulaDetail;
          cand2 = flavioDetail;
        } else if (flavioVap > lulaVap) {
          leader = 'BOLSONARO';
          color = '#12B24B';
          pvap = flavioPvap;
          vap = flavioVap;
          cand1 = flavioDetail;
          cand2 = lulaDetail;
        } else if (lulaVap > 0 || flavioVap > 0 || totalValidos > 0) {
          cand1 = lulaDetail;
          cand2 = flavioDetail;
        }

        results[m.cdi] = {
          leader,
          color,
          pvap,
          vap,
          pst,
          totalValidos,
          cand1,
          cand2,
        };

        // Dispara renderização progressiva dos municípios na tela
        triggerProgress();
      } catch {
        // Ignora falha de rede individual em município
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(CONCURRENCY_LIMIT, toFetch.length) },
    () => worker()
  );
  await Promise.all(workers);

  if (pendingProgressTimer) {
    clearTimeout(pendingProgressTimer);
    pendingProgressTimer = null;
  }
  triggerProgress(true);

  // Salva no IndexedDB de forma persistente com os municípios de 100% gravados definitivamente
  saveGenericDataToDb(votesDbKey, results).catch(() => {});
  return results;
}

/**
 * Constrói a estrutura de municípios mesclando a geometria do IBGE com os votos do TSE
 */
function buildStateMunicipalityData(
  mesh: CachedIbgeMesh,
  tseVotes: Record<string, TseMunicipalResult>
): StateMunicipalityData {
  const municipalities: MunicipalityPath[] = mesh.rawPaths.map((p) => {
    const vote = tseVotes[p.id];
    return {
      id: p.id,
      nome: p.nome,
      d: p.d,
      leader: vote?.leader || 'NONE',
      color: vote?.color || '#243B5A',
      pvap: vote?.pvap,
      vap: vote?.vap,
      pst: vote?.pst,
      totalValidos: vote?.totalValidos,
      cand1: vote?.cand1,
      cand2: vote?.cand2,
    };
  });

  return {
    uf: mesh.uf,
    viewBox: mesh.viewBox,
    municipalities,
  };
}

/**
 * Pré-carregamento silencioso ao passar o mouse (Hover-to-Prefetch)
 */
export function prefetchStateMunicipalities(uf: UF): void {
  if (uf === 'BR' || inFlightPrefetch.has(uf) || memoryCache[uf]) return;
  inFlightPrefetch.add(uf);
  fetchStateMunicipalities(uf).finally(() => {
    inFlightPrefetch.delete(uf);
  });
}

/**
 * Carrega a malha e a apuração com Renderização em Duas Fases:
 * 1. Entrega a malha do IBGE imediatamente via onInitialMesh (0ms do IndexedDB ou ~150ms de rede)
 * 2. Em segundo plano, busca e aplica a apuração do TSE sem travar a interface
 */
export async function fetchStateMunicipalities(
  uf: UF,
  onInitialMesh?: (data: StateMunicipalityData) => void
): Promise<StateMunicipalityData | null> {
  if (uf === 'BR') return null;

  // 1. Se já estiver no cache em memória com dados completos, retorna imediatamente
  if (memoryCache[uf]) {
    onInitialMesh?.(memoryCache[uf]!);
    return memoryCache[uf]!;
  }

  try {
    // 2. Busca malha do IBGE (do IndexedDB ou rede)
    const meshPromise = getOrFetchIbgeMesh(uf);
    // Votos do TSE em cache preliminar (SWR)
    const votesDbKey = `tse_votes_mun_${uf}`;
    const initialVotesPromise = getGenericDataFromDb<Record<string, TseMunicipalResult>>(votesDbKey);

    const [mesh, initialVotes] = await Promise.all([meshPromise, initialVotesPromise]);
    if (!mesh) return null;

    // FASE 1: Se o callback onInitialMesh for fornecido, renderiza na hora o mapa vetorial
    const initialData = buildStateMunicipalityData(mesh, initialVotes || {});
    onInitialMesh?.(initialData);

    // FASE 2: Busca a apuração oficial no TSE com stream progressivo em tempo real
    const freshTseVotes = await fetchTseMunicipalResultsForUf(uf, (interimVotes) => {
      if (onInitialMesh) {
        onInitialMesh(buildStateMunicipalityData(mesh, interimVotes));
      }
    });
    const finalData = buildStateMunicipalityData(mesh, freshTseVotes);

    // Salva no cache da memória RAM
    memoryCache[uf] = finalData;
    onInitialMesh?.(finalData);

    return finalData;
  } catch (err) {
    console.error(`Erro ao carregar municípios da UF ${uf}:`, err);
    return null;
  }
}
