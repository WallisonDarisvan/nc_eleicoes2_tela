import React from 'react';
import { 
  X, 
  Map, 
  Users, 
  UserCheck, 
  UserX, 
  FileText, 
  PieChart, 
  CheckCircle 
} from 'lucide-react';
import type { ElectionStats, RegionSummary, UF } from '../types/election';
import { formatPercentBR, formatVotesBR } from '../services/tseService';

interface MacroAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: ElectionStats;
  regionsData: RegionSummary[];
  onSelectRegionUf: (uf: UF) => void;
}

export const MacroAnalyticsModal: React.FC<MacroAnalyticsModalProps> = ({
  isOpen,
  onClose,
  stats,
  regionsData,
  onSelectRegionUf,
}) => {
  if (!isOpen) return null;

  const validPercent = stats.comparecimento > 0 ? (stats.votosValidos / stats.comparecimento) * 100 : 0;
  const nulosPercent = stats.comparecimento > 0 ? (stats.votosNulos / stats.comparecimento) * 100 : 0;
  const brancosPercent = stats.comparecimento > 0 ? (stats.votosBrancos / stats.comparecimento) * 100 : 0;
  const comparecimentoPercent = stats.totalEleitores > 0 ? (stats.comparecimento / stats.totalEleitores) * 100 : 0;
  const abstencaoPercent = stats.totalEleitores > 0 ? (stats.abstencao / stats.totalEleitores) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-studio-bg w-full max-w-5xl rounded-3xl border border-studio-border shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="bg-studio-navy text-white px-6 py-4 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-studio-accent/30 text-studio-accent">
              <PieChart className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-display font-black text-lg md:text-xl tracking-wide uppercase">
                PAINEL ANALÍTICO MACRO • CONSOLIDAÇÃO NACIONAL & REGIONAL
              </h2>
              <p className="text-xs text-slate-300">
                Auditoria de votos, abstenções e liderança nas 5 macrorregiões do Brasil
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Section 1: Macro Electoral Totals */}
          <div>
            <h3 className="font-display font-extrabold text-xs uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-studio-accent" />
              TOTAIS MACRO DE VOTAÇÃO (BRASIL)
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Votos Válidos */}
              <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-sm relative overflow-hidden">
                <div className="w-1.5 h-full bg-emerald-500 absolute left-0 top-0"></div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                  <span>VOTOS VÁLIDOS</span>
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="font-display font-black text-xl md:text-2xl text-slate-900">
                  {formatPercentBR(validPercent)}
                </div>
                <div className="text-xs font-mono font-bold text-slate-600 mt-1">
                  {formatVotesBR(stats.votosValidos)} votos
                </div>
              </div>

              {/* Votos Nulos */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="w-1.5 h-full bg-red-400 absolute left-0 top-0"></div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                  <span>VOTOS NULOS</span>
                  <UserX className="w-4 h-4 text-red-500" />
                </div>
                <div className="font-display font-black text-xl md:text-2xl text-slate-900">
                  {formatPercentBR(nulosPercent)}
                </div>
                <div className="text-xs font-mono font-bold text-slate-600 mt-1">
                  {formatVotesBR(stats.votosNulos)} votos
                </div>
              </div>

              {/* Votos Brancos */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="w-1.5 h-full bg-amber-400 absolute left-0 top-0"></div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                  <span>VOTOS BRANCOS</span>
                  <FileText className="w-4 h-4 text-amber-500" />
                </div>
                <div className="font-display font-black text-xl md:text-2xl text-slate-900">
                  {formatPercentBR(brancosPercent)}
                </div>
                <div className="text-xs font-mono font-bold text-slate-600 mt-1">
                  {formatVotesBR(stats.votosBrancos)} votos
                </div>
              </div>

              {/* Comparecimento vs Abstenção */}
              <div className="bg-white p-4 rounded-2xl border border-blue-200/80 shadow-sm relative overflow-hidden">
                <div className="w-1.5 h-full bg-studio-accent absolute left-0 top-0"></div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                  <span>COMPARECIMENTO</span>
                  <UserCheck className="w-4 h-4 text-studio-accent" />
                </div>
                <div className="font-display font-black text-xl md:text-2xl text-slate-900">
                  {formatPercentBR(comparecimentoPercent)}
                </div>
                <div className="text-xs font-mono font-bold text-slate-600 mt-1">
                  Abstenção: {formatPercentBR(abstencaoPercent)} ({formatVotesBR(stats.abstencao)})
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Cards das 5 Regiões com Percentual Apurado e Líder */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-extrabold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Map className="w-4 h-4 text-studio-accent" />
                LIDERANÇA E APURAÇÃO POR MACRORREGIÃO
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">
                Clique numa UF para carregar sua apuração detalhada
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {regionsData.map((reg) => (
                <div
                  key={reg.id}
                  className="bg-white rounded-2xl p-4 border border-studio-border/80 shadow-studio-card flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Region Name & Urnas Progress */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-display font-black text-base text-studio-navyDark tracking-wide">
                        {reg.nome}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-black bg-slate-100 text-slate-800 border border-slate-200">
                        {formatPercentBR(reg.pst, 1)} apurado
                      </span>
                    </div>

                    {/* Region Urnas Bar */}
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${reg.pst}%` }}
                      />
                    </div>

                    {/* Leader Spotlight */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                      <img
                        src={reg.leader.avatar}
                        alt={reg.leader.name}
                        className="w-12 h-12 rounded-xl object-cover object-top ring-2 ring-white shadow-sm flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          CANDIDATO LÍDER
                        </div>
                        <div className="font-display font-black text-sm text-slate-900 truncate">
                          {reg.leader.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-white text-slate-700 border border-slate-200">
                            {reg.leader.party}
                          </span>
                          <span className="font-display font-black text-xs text-studio-accent">
                            {formatPercentBR(reg.leader.pvap)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* UFs in this region */}
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase">
                      Estados da Região:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {reg.ufs.map((uf) => (
                        <button
                          key={uf}
                          onClick={() => {
                            onSelectRegionUf(uf);
                            onClose();
                          }}
                          className="px-2 py-1 rounded-md text-[11px] font-mono font-bold bg-slate-100 hover:bg-studio-navy hover:text-white text-slate-700 transition"
                          title={`Ver apuração de ${uf}`}
                        >
                          {uf}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Total de Eleitores Aptos: <strong>{formatVotesBR(stats.totalEleitores)}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-studio-navy text-white font-bold hover:bg-studio-navyDark transition"
          >
            Fechar Painel
          </button>
        </div>
      </div>
    </div>
  );
};
