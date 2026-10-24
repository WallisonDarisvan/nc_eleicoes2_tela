import type { Region, UF, UFInfo } from '../types/election';

export const REGIONS_DATA: Record<Region, UF[]> = {
  'NORTE': ['AC', 'AM', 'AP', 'PA', 'RO', 'RR', 'TO'],
  'NORDESTE': ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'],
  'CENTRO-OESTE': ['DF', 'GO', 'MS', 'MT'],
  'SUDESTE': ['ES', 'MG', 'RJ', 'SP'],
  'SUL': ['PR', 'RS', 'SC'],
};

export const UFS_INFO: Record<UF, UFInfo> = {
  'BR': { sigla: 'BR', nome: 'Brasil (Nacional)', regiao: 'SUDESTE', capital: 'Brasília', eleitores: 156454011 },
  // Norte
  'AC': { sigla: 'AC', nome: 'Acre', regiao: 'NORTE', capital: 'Rio Branco', eleitores: 588433 },
  'AM': { sigla: 'AM', nome: 'Amazonas', regiao: 'NORTE', capital: 'Manaus', eleitores: 2647826 },
  'AP': { sigla: 'AP', nome: 'Amapá', regiao: 'NORTE', capital: 'Macapá', eleitores: 550696 },
  'PA': { sigla: 'PA', nome: 'Pará', regiao: 'NORTE', capital: 'Belém', eleitores: 6082312 },
  'RO': { sigla: 'RO', nome: 'Rondônia', regiao: 'NORTE', capital: 'Porto Velho', eleitores: 1230987 },
  'RR': { sigla: 'RR', nome: 'Roraima', regiao: 'NORTE', capital: 'Boa Vista', eleitores: 366240 },
  'TO': { sigla: 'TO', nome: 'Tocantins', regiao: 'NORTE', capital: 'Palmas', eleitores: 1094003 },
  // Nordeste
  'AL': { sigla: 'AL', nome: 'Alagoas', regiao: 'NORDESTE', capital: 'Maceió', eleitores: 2415278 },
  'BA': { sigla: 'BA', nome: 'Bahia', regiao: 'NORDESTE', capital: 'Salvador', eleitores: 11291528 },
  'CE': { sigla: 'CE', nome: 'Ceará', regiao: 'NORDESTE', capital: 'Fortaleza', eleitores: 6820673 },
  'MA': { sigla: 'MA', nome: 'Maranhão', regiao: 'NORDESTE', capital: 'São Luís', eleitores: 5042999 },
  'PB': { sigla: 'PB', nome: 'Paraíba', regiao: 'NORDESTE', capital: 'João Pessoa', eleitores: 3056458 },
  'PE': { sigla: 'PE', nome: 'Pernambuco', regiao: 'NORDESTE', capital: 'Recife', eleitores: 7018098 },
  'PI': { sigla: 'PI', nome: 'Piauí', regiao: 'NORDESTE', capital: 'Teresina', eleitores: 2570236 },
  'RN': { sigla: 'RN', nome: 'Rio Grande do Norte', regiao: 'NORDESTE', capital: 'Natal', eleitores: 2554727 },
  'SE': { sigla: 'SE', nome: 'Sergipe', regiao: 'NORDESTE', capital: 'Aracaju', eleitores: 1671801 },
  // Centro-Oeste
  'DF': { sigla: 'DF', nome: 'Distrito Federal', regiao: 'CENTRO-OESTE', capital: 'Brasília', eleitores: 2203045 },
  'GO': { sigla: 'GO', nome: 'Goiás', regiao: 'CENTRO-OESTE', capital: 'Goiânia', eleitores: 4870354 },
  'MS': { sigla: 'MS', nome: 'Mato Grosso do Sul', regiao: 'CENTRO-OESTE', capital: 'Campo Grande', eleitores: 1996510 },
  'MT': { sigla: 'MT', nome: 'Mato Grosso', regiao: 'CENTRO-OESTE', capital: 'Cuiabá', eleitores: 2469414 },
  // Sudeste
  'ES': { sigla: 'ES', nome: 'Espírito Santo', regiao: 'SUDESTE', capital: 'Vitória', eleitores: 2928006 },
  'MG': { sigla: 'MG', nome: 'Minas Gerais', regiao: 'SUDESTE', capital: 'Belo Horizonte', eleitores: 16290870 },
  'RJ': { sigla: 'RJ', nome: 'Rio de Janeiro', regiao: 'SUDESTE', capital: 'Rio de Janeiro', eleitores: 12827296 },
  'SP': { sigla: 'SP', nome: 'São Paulo', regiao: 'SUDESTE', capital: 'São Paulo', eleitores: 34642644 },
  // Sul
  'PR': { sigla: 'PR', nome: 'Paraná', regiao: 'SUL', capital: 'Curitiba', eleitores: 8475632 },
  'RS': { sigla: 'RS', nome: 'Rio Grande do Sul', regiao: 'SUL', capital: 'Porto Alegre', eleitores: 8593469 },
  'SC': { sigla: 'SC', nome: 'Santa Catarina', regiao: 'SUL', capital: 'Florianópolis', eleitores: 5489658 },
};

export const CARGOS_LABEL: Record<string, { label: string; code: string; full: string }> = {
  'PRESIDENTE': { label: 'PRESIDENTE', code: '1', full: 'PRESIDENTE DA REPÚBLICA' },
  'GOVERNADOR': { label: 'GOVERNADOR', code: '3', full: 'GOVERNADOR DE ESTADO' },
  'SENADOR': { label: 'SENADOR', code: '5', full: 'SENADOR DA REPÚBLICA' },
  'DEP_FEDERAL': { label: 'DEP. FEDERAL', code: '6', full: 'DEPUTADO FEDERAL' },
  'DEP_ESTADUAL': { label: 'DEP. ESTADUAL', code: '7', full: 'DEPUTADO ESTADUAL' },
};
