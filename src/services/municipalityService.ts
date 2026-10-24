// Serviço de malhas e nomes oficiais de municípios via IBGE para nível 3 do mapa
import type { UF } from '../types/election';

export interface MunicipalityPath {
  id: string; // Código IBGE (ex: 3300100)
  nome: string;
  d: string;
  leader?: 'LULA' | 'BOLSONARO' | 'NONE';
  color?: string;
  pvap?: number;
  vap?: number;
}

export interface StateMunicipalityData {
  uf: UF;
  viewBox: string;
  municipalities: MunicipalityPath[];
}

const memoryCache: Partial<Record<UF, StateMunicipalityData>> = {};

export async function fetchStateMunicipalities(uf: UF): Promise<StateMunicipalityData | null> {
  if (uf === 'BR') return null;
  if (memoryCache[uf]) return memoryCache[uf]!;

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

    // Caso especial para Pernambuco (PE): Fernando de Noronha (2605459) fica a mais de 540km
    // a nordeste em pleno oceano Atlântico (lat -3.86, lon -32.42), o que distorcia e achatava
    // o continente de PE na base da tela. Nós o aproximamos da costa leste (norte de Recife)
    // com uma escala ampliada (4x) para garantir ótima visibilidade e facilidade de clique.
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

    const municipalities: MunicipalityPath[] = geojson.features.map((f: any) => {
      const id = String(f.properties?.codarea || f.id || '');
      const nome = namesMap.get(id) || `Município ${id}`;
      const d = geomToPath(f.geometry);
      return { id, nome, d };
    });

    const result: StateMunicipalityData = {
      uf,
      viewBox: `0 0 ${targetW + pad * 2} ${targetH + pad * 2}`,
      municipalities,
    };

    memoryCache[uf] = result;
    return result;
  } catch (err) {
    console.error(`Erro ao carregar municípios para UF ${uf}:`, err);
    return null;
  }
}
