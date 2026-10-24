import React from 'react';
import { 
  X, 
  Play, 
  Pause 
} from 'lucide-react';
import type { Candidate, Cargo, ElectionStats, UF } from '../types/election';
import { formatPercentBR, formatVotesBR } from '../services/tseService';
import { CARGOS_LABEL, UFS_INFO } from '../data/regionsAndUfs';

interface StudioBroadcastOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  cargo: Cargo;
  uf: UF;
  candidates: Candidate[];
  stats: ElectionStats;
  isSimulating: boolean;
  onTogglePlay: () => void;
}

export const StudioBroadcastOverlay: React.FC<StudioBroadcastOverlayProps> = ({
  isOpen,
  onClose,
  cargo,
  uf,
  candidates,
  stats,
  isSimulating,
  onTogglePlay,
}) => {
  if (!isOpen) return null;

  const topTwo = candidates.slice(0, 2);
  const remaining = candidates.slice(2, 6);
  const cargoInfo = CARGOS_LABEL[cargo] || { label: cargo, full: cargo };
  const ufInfo = UFS_INFO[uf] || { sigla: uf, nome: uf };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A192F] text-white flex flex-col justify-between p-6 md:p-10 select-none overflow-hidden font-display animate-fadeIn">
      {/* Top Studio HUD */}
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600 text-white font-black text-sm tracking-widest animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
            TRANSMISSÃO DE ESTÚDIO AO VIVO
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white uppercase">
              {cargoInfo.label} <span className="text-amber-400">|</span> {uf === 'BR' ? 'BRASIL' : ufInfo.nome}
            </h1>
          </div>
        </div>

        {/* Urnas Apuradas Large Counter */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs uppercase font-extrabold text-slate-400 tracking-widest">
              URNAS APURADAS
            </div>
            <div className="text-3xl md:text-5xl font-black text-emerald-400 font-mono">
              {formatPercentBR(stats.pst)}
            </div>
          </div>

          {/* Quick Play/Pause in Overlay */}
          <button
            onClick={onTogglePlay}
            className={`p-3 rounded-2xl transition ${
              isSimulating ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-white'
            }`}
            title={isSimulating ? 'Pausar Simulação' : 'Avançar Simulação'}
          >
            {isSimulating ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current" />}
          </button>

          <button
            onClick={onClose}
            className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition"
            title="Sair do Modo Estúdio"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Duel Stage (Top 2 Candidates Head-to-Head) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-auto">
        {topTwo.map((cand, idx) => {
          const isWinner = idx === 0;
          return (
            <div
              key={cand.n}
              className={`rounded-3xl p-6 md:p-8 flex flex-col justify-between border transition-all ${
                isWinner
                  ? 'bg-gradient-to-br from-[#152A57] via-[#0E1D3E] to-[#0A192F] border-amber-400/80 shadow-2xl ring-2 ring-amber-400/40'
                  : 'bg-white/5 border-white/15'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg ${
                        isWinner ? 'bg-amber-400 text-slate-950' : 'bg-white/20 text-white'
                      }`}
                    >
                      {idx + 1}º
                    </span>
                    <span className="text-xs md:text-sm font-bold tracking-widest text-slate-300 uppercase">
                      {cand.partido} • Nº {cand.n}
                    </span>
                  </div>

                  {cand.st && (
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm ${
                      cand.st === 'ELEITO' ? 'bg-emerald-600 text-white' :
                      cand.st === '2º TURNO' ? 'bg-[#152A57] text-white' :
                      cand.st === 'MATEMATICAMENTE ELEITO' ? 'bg-amber-400 text-slate-950' :
                      cand.st === 'NÃO ELEITO' ? 'bg-red-900/60 text-red-200' :
                      'bg-slate-700 text-white'
                    }`}>
                      {cand.st}
                    </span>
                  )}
                </div>

                {/* Candidate Photo & Massive Name */}
                <div className="flex items-center gap-5 my-4">
                  <img
                    src={cand.avatar}
                    alt={cand.nm}
                    className="w-24 h-24 md:w-32 md:h-32 rounded-3xl object-cover ring-4 ring-white/20 shadow-2xl flex-shrink-0"
                  />
                  <div>
                    <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
                      {cand.nm}
                    </h2>
                    <p className="text-xs md:text-sm text-slate-400 font-sans mt-1 line-clamp-2">
                      {cand.cc}
                    </p>
                  </div>
                </div>
              </div>

              {/* Massive Percentage and Votes */}
              <div className="mt-4 pt-4 border-t border-white/10 flex items-end justify-between">
                <div>
                  <div className="text-xs font-sans font-bold text-slate-400 uppercase tracking-widest">
                    VOTOS COMPUTADOS
                  </div>
                  <div className="text-xl md:text-3xl font-mono font-black text-slate-200">
                    {formatVotesBR(cand.vap)}
                  </div>
                </div>

                <div className="text-5xl md:text-7xl font-black text-amber-400">
                  {formatPercentBR(cand.pvap)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Minor Candidates Runner Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {remaining.map((cand, idx) => (
          <div
            key={cand.n}
            className="bg-white/5 rounded-2xl p-3 border border-white/10 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xs font-mono font-bold text-slate-400">{idx + 3}º</span>
              <div className="truncate">
                <div className="text-xs font-black truncate">{cand.nm}</div>
                <div className="text-[10px] text-slate-400">{cand.partido}</div>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-display font-black text-sm text-white">{formatPercentBR(cand.pvap)}</div>
              <div className="text-[10px] font-mono text-slate-400">{formatVotesBR(cand.vap)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
