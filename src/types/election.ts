export type UF = 
  | 'BR'
  | 'AC' | 'AL' | 'AM' | 'AP' | 'BA' | 'CE' | 'DF' | 'ES' | 'GO' 
  | 'MA' | 'MG' | 'MS' | 'MT' | 'PA' | 'PB' | 'PE' | 'PI' | 'PR' 
  | 'RJ' | 'RN' | 'RO' | 'RR' | 'RS' | 'SC' | 'SE' | 'SP' | 'TO';

export type Region = 'NORTE' | 'NORDESTE' | 'CENTRO-OESTE' | 'SUDESTE' | 'SUL';

export type Cargo = 'PRESIDENTE' | 'GOVERNADOR' | 'SENADOR' | 'DEP_FEDERAL' | 'DEP_ESTADUAL';

export interface Candidate {
  n: string;          // Número eleitoral (ex: "13", "22", "15")
  nm: string;         // Nome do candidato
  cc: string;         // Coligação / Partido (ex: "PT / PCdoB / PV")
  partido: string;    // Sigla do partido principal
  vap: number;        // Votos apurados absolutos
  pvap: number;       // Percentual de votos válidos (ex: 48.43)
  st: 'ELEITO' | '2º TURNO' | 'MATEMATICAMENTE ELEITO' | 'NÃO ELEITO' | 'EM APURAÇÃO' | '';
  avatar: string;     // URL da foto ou fallback de iniciais
  vice?: string;      // Nome do vice ou suplente
  cor?: string;       // Cor de identificação visual do partido
}

export interface ElectionStats {
  secoesTotalizadas: number;
  totalSecoes: number;
  pst: number;               // Percentual de seções totalizadas (ex: 98.42)
  votosValidos: number;
  votosNulos: number;
  votosBrancos: number;
  abstencao: number;
  comparecimento: number;
  totalEleitores: number;
  dataAtualizacao: string;
  horaAtualizacao: string;
  fase: '1º TURNO' | '2º TURNO';
  ano: number;
}

export interface RegionSummary {
  id: Region;
  nome: string;
  ufs: UF[];
  pst: number;
  leader: {
    name: string;
    party: string;
    pvap: number;
    avatar: string;
    color: string;
  };
  totalVotos: number;
}

export interface ElectionDataPackage {
  cargo: Cargo;
  uf: UF;
  stats: ElectionStats;
  candidates: Candidate[];
  isLive: boolean;
  dataSource: 'TSE_API' | 'SIMULADOR' | 'HISTORICO';
}

export interface UFInfo {
  sigla: UF;
  nome: string;
  regiao: Region;
  capital: string;
  eleitores: number;
}

export interface GovernorStateSummary {
  uf: UF;
  ufNome: string;
  is2oTurno: boolean;
  status: 'ELEITO' | '2º TURNO' | 'EM APURAÇÃO';
  pst: number;
  winner?: Candidate;
  candidate1?: Candidate;
  candidate2?: Candidate;
}

export interface PresidentStateSummary {
  uf: UF;
  ufNome: string;
  pst: number;
  leader: Candidate;
  second: Candidate;
  status: 'ELEITO' | 'EM APURAÇÃO' | 'LIDERANDO';
}


