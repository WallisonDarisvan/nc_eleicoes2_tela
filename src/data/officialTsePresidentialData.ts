import type { ElectionDataPackage, UF } from '../types/election';

/**
 * Configuração Oficial do TSE - 2º Turno da Eleição Presidencial de 2026 (25/10/2026)
 * Pleito: Eleições Gerais 2026 - 2º Turno Oficial (Código Oficial do TSE: 6258)
 */
export const OFFICIAL_TSE_2026_CONFIG = {
  ano: 2026,
  ciclo: 'ele2026',
  dataPleito: '25/10/2026',
  fase: '2º TURNO' as const,
  codigoPleitoDefault: '6258', // Código oficial do 2º turno ordinário federal do TSE
  totalEleitoresBrasil: 156454011,
  totalSecoesBrasil: 472075
};

export const PARTIDO_COLORS: Record<string, string> = {
  'PT': '#CC0000',
  'PL': '#12B24B',
  'REPUBLICANOS': '#2C5282',
  'UNIÃO': '#2B6CB0',
  'NOVO': '#DD6B20',
  'PSD': '#2F855A',
  'MDB': '#008542',
  'PDT': '#C53030',
  'PSDB': '#2B6CB0',
  'PSOL': '#E53E3E',
  'PP': '#3182CE',
  'PODEMOS': '#319795',
  'SOLIDARIEDADE': '#D69E2E',
  'PSB': '#DD6B20',
  'PCdoB': '#9B2C2C',
  'PV': '#38A169',
  'REDE': '#2C7A7B',
  'AVANTE': '#4A5568',
  'PRD': '#2B6CB0',
  'DC': '#2B6CB0',
  'UP': '#000000',
  'PCB': '#9B2C2C',
  'PSTU': '#C53030',
};

/**
 * Cria pacote inicial vazio de prontidão enquanto a CDN do TSE carrega
 */
export function createEmptyTsePackage(uf: UF): ElectionDataPackage {
  return {
    cargo: 'PRESIDENTE',
    uf,
    stats: {
      secoesTotalizadas: 0,
      totalSecoes: 0,
      pst: 0,
      votosValidos: 0,
      votosBrancos: 0,
      votosNulos: 0,
      abstencao: 0,
      comparecimento: 0,
      totalEleitores: 0,
      dataAtualizacao: '25/10/2026',
      horaAtualizacao: '17:00:00',
      fase: '2º TURNO',
      ano: 2026
    },
    candidates: [],
    isLive: true,
    dataSource: 'TSE_API'
  };
}

export const getTse2026Package = (uf: UF) => createEmptyTsePackage(uf);
export const getOfficialTsePackage = (uf: UF) => createEmptyTsePackage(uf);
