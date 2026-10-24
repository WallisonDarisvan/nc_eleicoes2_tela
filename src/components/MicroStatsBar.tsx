import React from 'react';
import type { Cargo, ElectionStats, UF } from '../types/election';
import { CARGOS_LABEL, UFS_INFO } from '../data/regionsAndUfs';
import { formatPercentBR, formatVotesBR } from '../services/tseService';

interface MicroStatsBarProps {
  uf: UF;
  cargo: Cargo;
  stats: ElectionStats;
}

export const MicroStatsBar: React.FC<MicroStatsBarProps> = ({ uf, cargo, stats }) => {
  const ufInfo = UFS_INFO[uf];
  const cargoInfo = CARGOS_LABEL[cargo] || { label: cargo, full: cargo };
  if (!ufInfo) return null;

  return (
    <div className="bg-white rounded-2xl p-4 border border-studio-border/80 shadow-studio-card mb-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Location details */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-studio-navy text-white flex items-center justify-center font-display font-black text-sm">
            {uf}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-base text-studio-navyDark">
                {ufInfo.nome}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                {uf === 'BR' ? 'Consolidado Nacional' : `Região ${ufInfo.regiao}`}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                {cargoInfo.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {uf === 'BR' 
                ? <>Abrangência: <strong>26 Estados + DF</strong> • Total de Eleitores: <strong>{formatVotesBR(ufInfo.eleitores)}</strong></>
                : <>Capital: <strong>{ufInfo.capital}</strong> • Total de Eleitores: <strong>{formatVotesBR(ufInfo.eleitores)}</strong></>
              }
            </p>
          </div>
        </div>

        {/* Right: Quick Micro Indicators */}
        <div className="grid grid-cols-3 gap-2 text-center md:text-right">
          <div className="bg-studio-slate p-2 rounded-xl border border-slate-200/50">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Votos Válidos</div>
            <div className="font-display font-black text-sm text-emerald-700">
              {formatVotesBR(stats.votosValidos)}
            </div>
          </div>

          <div className="bg-studio-slate p-2 rounded-xl border border-slate-200/50">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Brancos + Nulos</div>
            <div className="font-display font-black text-sm text-slate-700">
              {formatVotesBR(stats.votosBrancos + stats.votosNulos)}
            </div>
          </div>

          <div className="bg-studio-slate p-2 rounded-xl border border-slate-200/50">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Comparecimento</div>
            <div className="font-display font-black text-sm text-studio-accent">
              {formatPercentBR(stats.totalEleitores > 0 ? (stats.comparecimento / stats.totalEleitores) * 100 : 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
