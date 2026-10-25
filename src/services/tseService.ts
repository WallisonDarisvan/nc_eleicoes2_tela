import type { 
  Candidate, 
  Cargo, 
  ElectionDataPackage, 
  ElectionStats, 
  Region, 
  RegionSummary, 
  UF,
  GovernorStateSummary,
  PresidentStateSummary 
} from '../types/election';
import { REGIONS_DATA, UFS_INFO } from '../data/regionsAndUfs';
import { 
  OFFICIAL_TSE_2026_CONFIG,
  PARTIDO_COLORS,
  createEmptyTsePackage 
} from '../data/officialTsePresidentialData';
import { 
  getElectionSnapshotFromDb, 
  saveElectionSnapshotToDb, 
  preloadTopCandidatePhotos 
} from './imageDbService';

export interface TseJsonCandidate {
  n: string;
  sqcand: string;
  nm: string;
  nmu: string;
  dvt?: string;
  vap: string;
  pvap: string;
  e?: string;
  st?: string;
  vs?: Array<{ nmu: string; nm: string; tp: string; sgp?: string }>;
}

export interface TseJsonCargo {
  cd: string;
  nmn: string;
  agr: Array<{
    nm: string;
    com: string;
    par: Array<{
      n: string;
      sg: string;
      nm: string;
      cand: TseJsonCandidate[];
    }>;
  }>;
}

export interface TseFullResponse {
  ele: string;
  tpabr: string;
  cdabr: string;
  dg: string;
  hg: string;
  s: {
    ts: string;
    st: string;
    pst: string;
    snt?: string;
  };
  e?: {
    te: string;
    c: string;
    a: string;
  };
  v?: {
    tv: string;
    vvc: string;
    vb: string;
    vn: string;
    tvn?: string;
  };
  carg: TseJsonCargo[];
}

// Formatador brasileiro para números inteiros (ex: 12.345.678)
export function formatVotesBR(val: number): string {
  if (isNaN(val)) return '0';
  return Math.round(val).toLocaleString('pt-BR');
}

// Formatador brasileiro para percentuais (ex: 48,32%)
export function formatPercentBR(val: number, decimals: number = 2): string {
  if (isNaN(val)) return '0,00%';
  return `${val.toFixed(decimals).replace('.', ',')}%`;
}

// Converte cargo da aplicação no código de arquivo do TSE
export function getCargoTseFileCode(cargo: Cargo, uf: UF = 'BR'): string {
  switch (cargo) {
    case 'PRESIDENTE': return 'c0001';
    case 'GOVERNADOR': return 'c0003';
    case 'SENADOR': return 'c0005';
    case 'DEP_FEDERAL': return 'c0006';
    case 'DEP_ESTADUAL': return uf === 'DF' ? 'c0008' : 'c0007';
    default: return 'c0001';
  }
}

// Retorna o código oficial de pleito do 2º Turno 2026 (6258)
export function getElectionCode(_cargo?: Cargo): string {
  if (typeof window !== 'undefined') {
    const urlCode = new URLSearchParams(window.location.search).get('pleito');
    if (urlCode) return urlCode;
  }
  return OFFICIAL_TSE_2026_CONFIG.codigoPleitoDefault;
}

// Cache em memória calibrado para 5 segundos (alinhado com o max-age=6 da CDN do TSE)
const tseCache = new Map<string, { data: ElectionDataPackage; timestamp: number }>();
const CACHE_TTL_MS = 5000; // 5 segundos (intervalo ótimo oficial da CDN do TSE)

// Deduplicação de requisições simultâneas em andamento (In-Flight Request Deduplication)
const inFlightRequests = new Map<string, Promise<{ success: boolean; data: ElectionDataPackage; error?: string }>>();

// Armazenamento de ETags HTTP para evitar reprocessamento desnecessário (304 Not Modified)
const httpEtags = new Map<string, string>();

// Rastreamento centralizado do status oficial nacional da Eleição Presidencial (Brasil)
export const nationalPresidentStatusMap = new Map<string, Candidate['st']>();
export let nationalIsSegundoTurno = true;

/**
 * Pré-carrega silenciosamente em segundo plano dados de uma UF (Hover-to-Prefetch)
 */
export function prefetchLiveTseData(uf: UF, cargo: Cargo = 'PRESIDENTE'): void {
  const cacheKey = `${cargo}-${uf}`;
  if (tseCache.has(cacheKey) || inFlightRequests.has(cacheKey)) {
    return;
  }
  fetchLiveTseData(uf, cargo).catch(() => {});
}

/**
 * Busca dados reais diretamente na CDN oficial do TSE com SWR e deduplicação a cada 1 segundo
 */
export async function fetchLiveTseData(
  uf: UF = 'BR',
  cargo: Cargo = 'PRESIDENTE',
  onStaleSnapshot?: (cachedData: ElectionDataPackage) => void
): Promise<{ success: boolean; data: ElectionDataPackage; error?: string }> {
  const cacheKey = `${cargo}-${uf}`;
  const now = Date.now();

  // 1. Verifica se já existe uma requisição em andamento para a mesma UF/Cargo (Deduplicação)
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey)!;
  }

  // 2. Se houver cache em memória válido com menos de 1s, serve instantaneamente
  const cached = tseCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    onStaleSnapshot?.(cached.data);
    return { success: true, data: cached.data };
  }

  // 3. SWR: Se tiver cache em memória expirado ou no IndexedDB, aciona callback imediatamente (0ms de latência)
  if (cached) {
    onStaleSnapshot?.(cached.data);
  } else {
    getElectionSnapshotFromDb(cacheKey).then((dbSnapshot) => {
      if (dbSnapshot && onStaleSnapshot) {
        onStaleSnapshot(dbSnapshot);
      }
    }).catch(() => {});
  }

  // 4. Cria a promise de busca na rede diretamente da CDN oficial do TSE
  const fetchPromise = (async () => {
    const targetUf = uf;
    const ufCode = targetUf.toLowerCase();
    const electionCode = getElectionCode(cargo);
    const cargoFileCode = getCargoTseFileCode(cargo, targetUf);

    // URLs prioritária (Proxy local para evitar CORS) e direta na CDN oficial do TSE
    const primaryUrl = `/tse-api/oficial/ele2026/${electionCode}/dados/${ufCode}/${ufCode}-${cargoFileCode}-e00${electionCode}-u.json`;
    const directCdnUrl = `https://resultados.tse.jus.br/oficial/ele2026/${electionCode}/dados/${ufCode}/${ufCode}-${cargoFileCode}-e00${electionCode}-u.json`;

    try {
      const headers: Record<string, string> = {};
      const savedEtag = httpEtags.get(primaryUrl);
      if (savedEtag) {
        headers['If-None-Match'] = savedEtag;
      }

      let response: Response;
      try {
        response = await fetch(primaryUrl, { headers });
        if (!response.ok && response.status !== 304) {
          throw new Error(`Proxy status ${response.status}`);
        }
      } catch {
        // Fallback direto para a CDN oficial caso o proxy local esteja inacessível
        response = await fetch(directCdnUrl, { headers });
      }

      // Se o TSE respondeu 304 Not Modified, o arquivo não mudou
      if (response.status === 304 && cached) {
        cached.timestamp = now;
        return { success: true, data: cached.data };
      }

      if (!response.ok) {
        throw new Error(`TSE CDN HTTP ${response.status}: ${response.statusText}`);
      }

      const newEtag = response.headers.get('ETag');
      if (newEtag) {
        httpEtags.set(primaryUrl, newEtag);
      }

      // Lê o JSON oficial do TSE
      const raw: TseFullResponse = await response.json();
      const parsedData = parseTsePayload(raw, cargo, targetUf, electionCode);

      // Salva no cache em memória
      tseCache.set(cacheKey, { data: parsedData, timestamp: now });

      // Salva no IndexedDB de forma persistente
      saveElectionSnapshotToDb(cacheKey, parsedData).catch(() => {});

      // Pré-carrega fotos oficiais dos candidatos no IndexedDB
      preloadTopCandidatePhotos(parsedData.candidates);

      return {
        success: true,
        data: parsedData
      };
    } catch {
      // Se a conexão falhar ou o arquivo ainda estiver sendo gerado, retorna o pacote inicial limpo
      if (cached) {
        return { success: true, data: cached.data };
      }
      const emptyData = createEmptyTsePackage(targetUf);
      return {
        success: true,
        data: emptyData
      };
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
}

// Analisador do formato oficial de dados do TSE
function parseTsePayload(
  raw: TseFullResponse,
  cargo: Cargo,
  uf: UF,
  electionCode: string
): ElectionDataPackage {
  const pst = parseFloat((raw.s?.pst || '0').replace(',', '.')) || 0;
  const totalSecoes = parseInt(raw.s?.ts || '0', 10) || 1;
  const secoesTotalizadas = parseInt(raw.s?.st || '0', 10) || Math.round((pst / 100) * totalSecoes);

  const totalEleitores = parseInt(raw.e?.te || '0', 10) || UFS_INFO[uf]?.eleitores || 0;
  const comparecimento = parseInt(raw.e?.c || '0', 10) || 0;
  const abstencao = parseInt(raw.e?.a || '0', 10) || (totalEleitores > comparecimento ? totalEleitores - comparecimento : 0);

  const votosValidos = parseInt(raw.v?.vvc || raw.v?.tv || '0', 10);
  const votosBrancos = parseInt(raw.v?.vb || '0', 10);
  const votosNulos = parseInt(raw.v?.tvn || raw.v?.vn || '0', 10);

  const candidatesList: Candidate[] = [];
  const cargoBlock = raw.carg?.[0];

  if (cargoBlock?.agr) {
    cargoBlock.agr.forEach((agrem) => {
      agrem.par?.forEach((partidoItem) => {
        partidoItem.cand?.forEach((c) => {
          const vap = parseInt(c.vap || '0', 10);
          const pvap = parseFloat((c.pvap || '0').replace(',', '.')) || 0;
          const partido = partidoItem.sg?.trim() || 'IND';

          const rawSt = (c.st || '').toUpperCase();
          const isEleitoTse = rawSt.includes('ELEITO') && !rawSt.includes('NÃO') && !rawSt.includes('NAO');
          const isNaoEleitoTse = rawSt.includes('NÃO ELEITO') || rawSt.includes('NAO ELEITO');

          let situacao: Candidate['st'] = 'EM APURAÇÃO';
          if (uf === 'BR') {
            if (isEleitoTse && pvap > 50) {
              situacao = 'ELEITO';
            } else if (isNaoEleitoTse) {
              situacao = 'NÃO ELEITO';
            } else if (pst >= 95 && pvap > 50) {
              situacao = 'MATEMATICAMENTE ELEITO';
            } else {
              situacao = 'EM APURAÇÃO';
            }
          }

          // URL oficial da foto na CDN do TSE
          const photoUrl = `/tse-api/oficial/ele2026/${electionCode}/fotos/br/${c.sqcand}.jpeg`;

          // Vice oficial registrado no TSE
          const viceNome = c.vs?.[0]?.nmu || c.vs?.[0]?.nm || undefined;

          // Cor do candidato
          const cor = c.n === '13' ? '#CC0000' : c.n === '22' ? '#12B24B' : (PARTIDO_COLORS[partido] || '#152A57');

          candidatesList.push({
            n: c.n,
            nm: c.nmu || c.nm,
            partido: partido,
            cc: agrem.nm || partido,
            vap: vap,
            pvap: pvap,
            st: situacao,
            avatar: photoUrl,
            vice: viceNome,
            cor: cor
          });
        });
      });
    });
  }

  // Ordena por votos apurados (decrescente)
  candidatesList.sort((a, b) => b.vap - a.vap);

  const stats: ElectionStats = {
    secoesTotalizadas,
    totalSecoes,
    pst,
    votosValidos,
    votosBrancos,
    votosNulos,
    abstencao,
    comparecimento,
    totalEleitores,
    dataAtualizacao: raw.dg || '25/10/2026',
    horaAtualizacao: raw.hg || '17:00:00',
    fase: '2º TURNO',
    ano: 2026
  };

  return {
    cargo,
    uf,
    stats,
    candidates: candidatesList,
    isLive: true,
    dataSource: 'TSE_API'
  };
}

// Busca e consolida os dados das 5 Macrorregiões para o 2º Turno Presidencial 2026
export async function fetchLiveMacroRegions(): Promise<RegionSummary[]> {
  const regions: Region[] = ['NORTE', 'NORDESTE', 'CENTRO-OESTE', 'SUDESTE', 'SUL'];
  const summaries: RegionSummary[] = [];

  for (const reg of regions) {
    const ufs = REGIONS_DATA[reg];

    summaries.push({
      id: reg,
      nome: reg,
      ufs,
      pst: 0.0,
      leader: {
        name: 'EM APURAÇÃO',
        party: '',
        pvap: 0.0,
        avatar: '',
        color: '#152A57'
      },
      totalVotos: 0
    });
  }

  return summaries;
}

/**
 * Busca e consolida a apuração completa para uma região inteira somando todos os seus estados
 */
export async function fetchLiveRegionData(
  region: Region,
  onStaleSnapshot?: (cachedData: ElectionDataPackage) => void
): Promise<{ success: boolean; data: ElectionDataPackage; error?: string }> {
  const ufs = REGIONS_DATA[region];
  const cacheKey = `PRESIDENTE-REGION-${region}`;
  const now = Date.now();
  const cached = tseCache.get(cacheKey);

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return { success: true, data: cached.data };
  }

  if (cached && onStaleSnapshot) {
    onStaleSnapshot(cached.data);
  }

  try {
    const results = await Promise.all(
      ufs.map((uf) => fetchLiveTseData(uf, 'PRESIDENTE'))
    );

    let totalVotosValidos = 0;
    let totalVotosBrancos = 0;
    let totalVotosNulos = 0;
    let totalAbstencao = 0;
    let totalComparecimento = 0;
    let totalEleitores = 0;
    let totalSecoes = 0;
    let secoesTotalizadas = 0;

    const candMap = new Map<string, { vap: number; template: Candidate }>();

    for (const res of results) {
      if (res.success && res.data) {
        const pkg = res.data;
        totalVotosValidos += pkg.stats.votosValidos;
        totalVotosBrancos += pkg.stats.votosBrancos;
        totalVotosNulos += pkg.stats.votosNulos;
        totalAbstencao += pkg.stats.abstencao;
        totalComparecimento += pkg.stats.comparecimento;
        totalEleitores += pkg.stats.totalEleitores;
        totalSecoes += pkg.stats.totalSecoes;
        secoesTotalizadas += pkg.stats.secoesTotalizadas;

        for (const cand of pkg.candidates) {
          const existing = candMap.get(cand.n);
          if (existing) {
            existing.vap += cand.vap;
          } else {
            candMap.set(cand.n, { vap: cand.vap, template: { ...cand } });
          }
        }
      }
    }

    const consolidatedCandidates: Candidate[] = [];
    for (const { vap, template } of candMap.values()) {
      const pvap = totalVotosValidos > 0 ? (vap / totalVotosValidos) * 100 : 0;
      consolidatedCandidates.push({
        ...template,
        vap,
        pvap: parseFloat(pvap.toFixed(2))
      });
    }

    consolidatedCandidates.sort((a, b) => b.vap - a.vap);

    const pst = totalSecoes > 0 ? (secoesTotalizadas / totalSecoes) * 100 : 0;

    const consolidatedStats: ElectionStats = {
      secoesTotalizadas,
      totalSecoes,
      pst: parseFloat(pst.toFixed(2)),
      votosValidos: totalVotosValidos,
      votosBrancos: totalVotosBrancos,
      votosNulos: totalVotosNulos,
      abstencao: totalAbstencao,
      comparecimento: totalComparecimento,
      totalEleitores,
      dataAtualizacao: new Date().toLocaleDateString('pt-BR'),
      horaAtualizacao: new Date().toLocaleTimeString('pt-BR'),
      fase: '2º TURNO',
      ano: 2026
    };

    const pkg: ElectionDataPackage = {
      cargo: 'PRESIDENTE',
      uf: 'BR',
      stats: consolidatedStats,
      candidates: consolidatedCandidates,
      isLive: true,
      dataSource: 'TSE_API'
    };

    tseCache.set(cacheKey, { data: pkg, timestamp: now });

    return { success: true, data: pkg };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (cached) {
      return { success: true, data: cached.data };
    }
    const empty = createEmptyTsePackage('BR');
    return { success: true, data: empty, error: errorMsg };
  }
}

/**
 * Consolida imediatamente os dados da região a partir dos estados já presentes no cache em memória
 */
export function consolidateRegionFromMemory(region: Region): ElectionDataPackage | null {
  const ufs = REGIONS_DATA[region];
  if (!ufs || ufs.length === 0) return null;

  let totalVotosValidos = 0;
  let totalVotosBrancos = 0;
  let totalVotosNulos = 0;
  let totalAbstencao = 0;
  let totalComparecimento = 0;
  let totalEleitores = 0;
  let totalSecoes = 0;
  let secoesTotalizadas = 0;

  const candMap = new Map<string, { vap: number; template: Candidate }>();
  let hasAtLeastOne = false;

  for (const uf of ufs) {
    const cached = tseCache.get(`PRESIDENTE-${uf}`);
    if (cached && cached.data) {
      hasAtLeastOne = true;
      const pkg = cached.data;
      totalVotosValidos += pkg.stats.votosValidos;
      totalVotosBrancos += pkg.stats.votosBrancos;
      totalVotosNulos += pkg.stats.votosNulos;
      totalAbstencao += pkg.stats.abstencao;
      totalComparecimento += pkg.stats.comparecimento;
      totalEleitores += pkg.stats.totalEleitores;
      totalSecoes += pkg.stats.totalSecoes;
      secoesTotalizadas += pkg.stats.secoesTotalizadas;

      for (const cand of pkg.candidates) {
        const existing = candMap.get(cand.n);
        if (existing) {
          existing.vap += cand.vap;
        } else {
          candMap.set(cand.n, { vap: cand.vap, template: { ...cand } });
        }
      }
    }
  }

  if (!hasAtLeastOne) return null;

  const consolidatedCandidates: Candidate[] = [];
  for (const { vap, template } of candMap.values()) {
    const pvap = totalVotosValidos > 0 ? (vap / totalVotosValidos) * 100 : 0;
    consolidatedCandidates.push({
      ...template,
      vap,
      pvap: parseFloat(pvap.toFixed(2))
    });
  }
  consolidatedCandidates.sort((a, b) => b.vap - a.vap);

  const pst = totalSecoes > 0 ? (secoesTotalizadas / totalSecoes) * 100 : 0;

  const consolidatedStats: ElectionStats = {
    secoesTotalizadas,
    totalSecoes,
    pst: parseFloat(pst.toFixed(2)),
    votosValidos: totalVotosValidos,
    votosBrancos: totalVotosBrancos,
    votosNulos: totalVotosNulos,
    abstencao: totalAbstencao,
    comparecimento: totalComparecimento,
    totalEleitores,
    dataAtualizacao: new Date().toLocaleDateString('pt-BR'),
    horaAtualizacao: new Date().toLocaleTimeString('pt-BR'),
    fase: '2º TURNO',
    ano: 2026
  };

  const pkg: ElectionDataPackage = {
    cargo: 'PRESIDENTE',
    uf: 'BR',
    stats: consolidatedStats,
    candidates: consolidatedCandidates,
    isLive: true,
    dataSource: 'TSE_API'
  };

  const cacheKey = `PRESIDENTE-REGION-${region}`;
  tseCache.set(cacheKey, { data: pkg, timestamp: Date.now() });

  return pkg;
}

/**
 * Retorna os dados da região salvos em memória para transição instantânea (0ms e sem oscilações)
 */
export function getCachedRegionData(region: Region): ElectionDataPackage | null {
  const cacheKey = `PRESIDENTE-REGION-${region}`;
  const cached = tseCache.get(cacheKey);
  if (cached) return cached.data;
  return consolidateRegionFromMemory(region);
}

/**
 * Retorna os dados nacionais de Presidente salvos em memória
 */
export function getCachedNationalData(): ElectionDataPackage | null {
  const cached = tseCache.get('PRESIDENTE-BR');
  return cached ? cached.data : null;
}

/**
 * Prefetch cadenciado para todos os estados da região inteira
 */
export function prefetchLiveRegionData(region: Region): void {
  const ufs = REGIONS_DATA[region];
  if (Array.isArray(ufs)) {
    ufs.forEach((uf) => {
      prefetchLiveTseData(uf, 'PRESIDENTE');
    });
  }
}

/**
 * Panorama oficial dos 27 estados na eleição PRESIDENCIAL de 2º Turno 2026 extraído diretamente da CDN do TSE
 */
export async function fetchPresidentStatesSummaryList(): Promise<PresidentStateSummary[]> {
  const ufs = (Object.keys(UFS_INFO) as UF[]).filter((u) => u !== 'BR');

  // Busca dados de todas as 27 UFs em paralelo na CDN do TSE
  const results = await Promise.all(
    ufs.map(async (uf) => {
      const ufInfo = UFS_INFO[uf];
      try {
        const res = await fetchLiveTseData(uf, 'PRESIDENTE');
        if (res.success && res.data && res.data.candidates.length >= 2) {
          const leader = res.data.candidates[0];
          const second = res.data.candidates[1];
          return {
            uf,
            ufNome: ufInfo?.nome || uf,
            pst: res.data.stats.pst,
            leader,
            second,
            status: (res.data.stats.pst >= 95 && leader.pvap > 50) ? ('ELEITO' as const) : ('EM APURAÇÃO' as const)
          };
        }
      } catch {
        // Ignora erro individual
      }

      // Estado padrão caso o TSE ainda não tenha respondido essa UF
      const placeholderCand: Candidate = {
        n: '--',
        nm: 'AGUARDANDO',
        partido: '--',
        cc: '',
        vap: 0,
        pvap: 0,
        st: 'EM APURAÇÃO',
        avatar: ''
      };

      return {
        uf,
        ufNome: ufInfo?.nome || uf,
        pst: 0.0,
        leader: placeholderCand,
        second: placeholderCand,
        status: 'EM APURAÇÃO' as const
      };
    })
  );

  return results;
}

export async function fetchGovernorsSummaryList(): Promise<GovernorStateSummary[]> {
  const ufs = (Object.keys(UFS_INFO) as UF[]).filter((u) => u !== 'BR');
  return ufs.map((uf) => ({
    uf,
    ufNome: UFS_INFO[uf]?.nome || uf,
    is2oTurno: false,
    status: 'ELEITO' as const,
    pst: 100.0,
  }));
}
