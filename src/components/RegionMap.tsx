import React from 'react';
import { CheckCircle, Users, Layers } from 'lucide-react';
import type { Cargo, Region, UF } from '../types/election';
import { UFS_INFO } from '../data/regionsAndUfs';
import { prefetchLiveTseData } from '../services/tseService';

interface RegionMapProps {
  region: Region;
  selectedUf: UF;
  isRegionTotal?: boolean;
  currentCargo?: Cargo;
  onSelectUf: (uf: UF) => void;
  onSelectRegionTotal?: () => void;
  onBackToBrazil?: () => void;
}

// Layout e posições relativas dos estados dentro de cada região para visualização televisiva
interface StateCardLayout {
  uf: UF;
  name: string;
  gridArea?: string;
  desc?: string;
}

const REGION_STATE_LAYOUTS: Record<Region, StateCardLayout[]> = {
  'SUL': [
    { uf: 'PR', name: 'Paraná', desc: 'Curitiba • 8.4M eleitores' },
    { uf: 'SC', name: 'Santa Catarina', desc: 'Florianópolis • 5.4M eleitores' },
    { uf: 'RS', name: 'Rio Grande do Sul', desc: 'Porto Alegre • 8.5M eleitores' },
  ],
  'SUDESTE': [
    { uf: 'MG', name: 'Minas Gerais', desc: 'Belo Horizonte • 16.2M eleitores' },
    { uf: 'ES', name: 'Espírito Santo', desc: 'Vitória • 2.9M eleitores' },
    { uf: 'SP', name: 'São Paulo', desc: 'São Paulo • 34.6M eleitores' },
    { uf: 'RJ', name: 'Rio de Janeiro', desc: 'Rio de Janeiro • 12.8M eleitores' },
  ],
  'CENTRO-OESTE': [
    { uf: 'MT', name: 'Mato Grosso', desc: 'Cuiabá • 2.4M eleitores' },
    { uf: 'GO', name: 'Goiás', desc: 'Goiânia • 4.8M eleitores' },
    { uf: 'DF', name: 'Distrito Federal', desc: 'Brasília • 2.2M eleitores' },
    { uf: 'MS', name: 'Mato Grosso do Sul', desc: 'Campo Grande • 1.9M eleitores' },
  ],
  'NORDESTE': [
    { uf: 'MA', name: 'Maranhão', desc: 'São Luís • 5.0M eleitores' },
    { uf: 'PI', name: 'Piauí', desc: 'Teresina • 2.5M eleitores' },
    { uf: 'CE', name: 'Ceará', desc: 'Fortaleza • 6.8M eleitores' },
    { uf: 'RN', name: 'Rio Grande do Norte', desc: 'Natal • 2.5M eleitores' },
    { uf: 'PB', name: 'Paraíba', desc: 'João Pessoa • 3.0M eleitores' },
    { uf: 'PE', name: 'Pernambuco', desc: 'Recife • 7.0M eleitores' },
    { uf: 'AL', name: 'Alagoas', desc: 'Maceió • 2.4M eleitores' },
    { uf: 'SE', name: 'Sergipe', desc: 'Aracaju • 1.6M eleitores' },
    { uf: 'BA', name: 'Bahia', desc: 'Salvador • 11.2M eleitores' },
  ],
  'NORTE': [
    { uf: 'RR', name: 'Roraima', desc: 'Boa Vista • 366K eleitores' },
    { uf: 'AP', name: 'Amapá', desc: 'Macapá • 550K eleitores' },
    { uf: 'AM', name: 'Amazonas', desc: 'Manaus • 2.6M eleitores' },
    { uf: 'PA', name: 'Pará', desc: 'Belém • 6.0M eleitores' },
    { uf: 'AC', name: 'Acre', desc: 'Rio Branco • 588K eleitores' },
    { uf: 'RO', name: 'Rondônia', desc: 'Porto Velho • 1.2M eleitores' },
    { uf: 'TO', name: 'Tocantins', desc: 'Palmas • 1.0M eleitores' },
  ],
};

// SVG visual simplificado para dar destaque televisivo a cada região
export const RegionMap: React.FC<RegionMapProps> = ({
  region,
  selectedUf,
  isRegionTotal = false,
  currentCargo = 'GOVERNADOR',
  onSelectUf,
  onSelectRegionTotal,
}) => {
  const states = REGION_STATE_LAYOUTS[region] || [];
  const totalRegionalElectors = states.reduce((acc, st) => acc + (UFS_INFO[st.uf]?.eleitores || 0), 0);

  return (
    <div className="w-full h-full min-h-0 flex flex-col bg-[#E8EEF5]/85 backdrop-blur-md rounded-3xl border-2 border-[#8FA7C4] p-3.5 sm:p-4 shadow-sm">
      {/* Instrução televisiva no topo da coluna */}
      <div className="text-xs font-bold text-[#152A57]/80 mb-2 flex items-center justify-between flex-shrink-0 pb-1.5 border-b border-[#B5C7D9]/40">
        <span>Selecione a região ou o estado:</span>
        <span className="font-mono text-[11px] text-[#152A57] font-black">
          {states.length} ESTADOS
        </span>
      </div>

      {/* Opção de Visualizar o Total Consolidado da Região */}
      {onSelectRegionTotal && (
        <div
          onClick={onSelectRegionTotal}
          className={`p-3 rounded-2xl cursor-pointer transition-all duration-200 border flex items-center justify-between gap-3 mb-2 flex-shrink-0 ${
            isRegionTotal
              ? 'bg-[#152A57] text-white border-[#152A57] shadow-md scale-[1.02]'
              : 'bg-white/90 hover:bg-white text-[#152A57] border-[#B5C7D9]/50 hover:border-[#152A57]'
          }`}
          title={`Exibir apuração total consolidada de todos os ${states.length} estados da Região ${region}`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center font-display font-black text-lg shadow-sm flex-shrink-0 ${
                isRegionTotal ? 'bg-white text-[#152A57]' : 'bg-[#DDE5EE] text-[#152A57]'
              }`}
            >
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-black text-xs uppercase tracking-wide truncate flex items-center gap-1.5">
                <span>TOTAL DA REGIÃO {region}</span>
              </div>
              <div className={`text-[11px] font-semibold truncate ${isRegionTotal ? 'text-blue-100' : 'text-[#152A57]/70'}`}>
                Consolidado ({states.length} Estados)
              </div>
              <div className={`text-[10px] font-mono ${isRegionTotal ? 'text-blue-200' : 'text-slate-500'}`}>
                {totalRegionalElectors.toLocaleString('pt-BR')} eleitores
              </div>
            </div>
          </div>

          <div className="flex-shrink-0">
            {isRegionTotal ? (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-white text-[#152A57] tracking-wider shadow-sm animate-pulse">
                <CheckCircle className="w-3 h-3" />
                ATIVO
              </span>
            ) : (
              <span className="text-xs font-bold text-[#152A57]/50 group-hover:text-[#152A57]">
                Exibir →
              </span>
            )}
          </div>
        </div>
      )}

      {/* Grid de Estados da Região - rolagem interna exclusiva */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 overflow-y-auto flex-1 min-h-0 pr-1">
        {states.map((st) => {
          const isSelected = !isRegionTotal && selectedUf === st.uf;
          const info = UFS_INFO[st.uf];

          return (
            <div
              key={st.uf}
              onClick={() => onSelectUf(st.uf)}
              onMouseEnter={() => prefetchLiveTseData(st.uf, currentCargo)}
              className={`p-3.5 rounded-2xl cursor-pointer transition-all duration-200 border flex items-center justify-between gap-3 ${
                isSelected
                  ? 'bg-gradient-to-r from-[#152A57] to-[#1E3A6D] text-white border-[#152A57] shadow-md scale-[1.02]'
                  : 'bg-white/80 hover:bg-white text-[#152A57] border-[#B5C7D9]/50 hover:border-[#152A57]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Sigla da UF */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-display font-black text-lg shadow-sm flex-shrink-0 ${
                    isSelected
                      ? 'bg-[#1D4ED8] text-white'
                      : 'bg-[#DDE5EE] text-[#152A57]'
                  }`}
                >
                  {st.uf}
                </div>

                {/* Nome do Estado e Eleitorado */}
                <div className="min-w-0">
                  <div className="font-black text-sm uppercase tracking-wide truncate">
                    {st.name}
                  </div>
                  <div
                    className={`text-[11px] font-semibold truncate ${
                      isSelected ? 'text-blue-200' : 'text-[#152A57]/70'
                    }`}
                  >
                    Capital: {info?.capital || '—'}
                  </div>
                  <div
                    className={`text-[10px] font-mono ${
                      isSelected ? 'text-blue-300' : 'text-slate-500'
                    }`}
                  >
                    {info?.eleitores?.toLocaleString('pt-BR')} eleitores
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex-shrink-0">
                {isSelected ? (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-[#1D4ED8] text-white tracking-wider shadow-sm animate-pulse">
                    <CheckCircle className="w-3 h-3" />
                    ATIVO
                  </span>
                ) : (
                  <span className="text-xs font-bold text-[#152A57]/50 group-hover:text-[#152A57]">
                    Exibir →
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Box explicativo ao rodapé da coluna do mapa */}
      <div className="mt-auto pt-3 border-t border-[#B5C7D9]/40 flex items-center justify-between text-[11px] text-[#152A57]/70">
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5 text-[#152A57]" />
          Votação apurada via CDN TSE
        </span>
        <span className="font-mono font-bold text-[#152A57]">
          {isRegionTotal ? `TOTAL REGIÃO ${region}` : `UF ATIVA: ${selectedUf}`}
        </span>
      </div>
    </div>
  );
};
