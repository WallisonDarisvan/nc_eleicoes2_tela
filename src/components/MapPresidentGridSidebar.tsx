import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Trophy } from 'lucide-react';
import type { UF, PresidentStateSummary, Candidate } from '../types/election';
import { 
  OFFICIAL_TSE_2026_CONFIG 
} from '../data/officialTsePresidentialData';
import { 
  formatPercentBR, 
  formatVotesBR, 
  fetchLiveTseData, 
  fetchPresidentStatesSummaryList 
} from '../services/tseService';
import { getGenericDataFromDb, getElectionSnapshotFromDb } from '../services/imageDbService';

interface MapPresidentGridSidebarProps {
  onSelectUf: (uf: UF) => void;
  onOpenMacroAnalytics?: () => void;
  hoveredUf?: UF | null;
  onHoverUf?: (uf: UF | null) => void;
}

export const MapPresidentGridSidebar: React.FC<MapPresidentGridSidebarProps> = ({
  onSelectUf,
  hoveredUf,
  onHoverUf,
}) => {
  const [filterMode, setFilterMode] = useState<'TODOS' | string>('TODOS');
  const [statesList, setStatesList] = useState<PresidentStateSummary[]>([]);
  const [nationalCandidates, setNationalCandidates] = useState<Candidate[]>([]);
  const [nationalPst, setNationalPst] = useState<number>(0);

  // Carrega e atualiza a cada 5 segundos dados reais e oficiais diretamente da CDN do TSE com suporte offline
  useEffect(() => {
    let isMounted = true;

    // Inicialização instantânea do snapshot salvo no IndexedDB se existir (0ms)
    getGenericDataFromDb<PresidentStateSummary[]>('tse_president_states_summary_v1').then((saved) => {
      if (isMounted && saved && saved.length > 0) {
        setStatesList((prev) => (prev.length === 0 ? saved : prev));
      }
    }).catch(() => {});

    getElectionSnapshotFromDb('PRESIDENTE-BR').then((saved) => {
      if (isMounted && saved && saved.candidates && saved.candidates.length > 0) {
        setNationalCandidates((prev) => (prev.length === 0 ? saved.candidates : prev));
        setNationalPst((prev) => (prev === 0 ? saved.stats.pst : prev));
      }
    }).catch(() => {});

    const loadData = async () => {
      try {
        const [natRes, statesRes] = await Promise.all([
          fetchLiveTseData('BR', 'PRESIDENTE'),
          fetchPresidentStatesSummaryList()
        ]);

        if (isMounted) {
          if (natRes.success && natRes.data && natRes.data.candidates.length > 0) {
            setNationalCandidates(natRes.data.candidates);
            setNationalPst(natRes.data.stats.pst);
          }
          if (statesRes && statesRes.length > 0) {
            setStatesList(statesRes);
          }
        }
      } catch {
        // Silencioso para polling contínuo
      }
    };

    loadData();
    const interval = setInterval(loadData, 5000); // 5 segundos (ótimo oficial)

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const candA = nationalCandidates[0] || null;
  const candB = nationalCandidates[1] || null;

  const filteredStates = useMemo(() => {
    if (filterMode === 'TODOS' || !filterMode) {
      return statesList;
    }
    return statesList.filter((s) => s.leader.partido === filterMode || s.leader.n === filterMode);
  }, [statesList, filterMode]);

  const handleCardMouseEnter = useCallback((uf: UF) => {
    onHoverUf?.(uf);
  }, [onHoverUf]);

  const handleCardMouseLeave = useCallback(() => {
    onHoverUf?.(null);
  }, [onHoverUf]);

  return (
    <aside className="w-full h-full min-h-0 flex flex-col select-none flex-shrink-0 overflow-hidden pr-0.5">
      <div className="flex-1 w-full min-h-0 overflow-y-auto space-y-2.5 sm:space-y-3 pr-1 text-[#152A57]">
        
        {/* ======================================================== */}
        {/* 1. SEÇÃO DUELO NACIONAL: DADOS REAIS DA CDN OFICIAL TSE  */}
        {/* ======================================================== */}
        <div className="space-y-2 flex-shrink-0">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="font-display font-black text-xs sm:text-sm uppercase tracking-wider text-[#152A57]">
                PRESIDENTE DA REPÚBLICA • CDN TSE
              </h3>
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#152A57] text-white tracking-widest shadow-xs">
              {nationalPst > 0 ? `${formatPercentBR(nationalPst)} APURADO` : '0,00% APURADO'}
            </span>
          </div>

          {/* Cards dos 2 Candidatos Presidenciais carregados dinamicamente da CDN do TSE */}
          <div className="grid grid-cols-2 gap-2">
            {candA ? (
              <div
                onClick={() => onSelectUf('BR')}
                className="p-2 sm:p-2.5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex items-center gap-2 sm:gap-3 shadow-xs hover:shadow-md bg-white border-slate-200 hover:border-[#152A57] group"
                style={{ borderColor: candA.cor || '#152A57' }}
                title={`Clique para ver apuração nacional: ${candA.nm}`}
              >
                <div className="relative w-16 sm:w-20 aspect-square rounded-xl overflow-hidden bg-[#DDE6F0] border shadow-inner flex-shrink-0">
                  <img
                    src={candA.avatar}
                    alt={candA.nm}
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                  />
                  <span 
                    className="absolute bottom-0 inset-x-0 text-white text-[8px] font-black text-center py-0.5 uppercase tracking-wider"
                    style={{ backgroundColor: candA.cor || '#152A57' }}
                  >
                    {candA.partido} • {candA.n}
                  </span>
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                      <Trophy className="w-2.5 h-2.5" />
                      2º TURNO
                    </span>
                    <span className="text-[10px] font-black text-[#152A57] font-display">{candA.n}</span>
                  </div>

                  <h4 className="font-display font-black text-xs sm:text-sm text-[#152A57] uppercase leading-tight truncate mt-0.5">
                    {candA.nm}
                  </h4>

                  <div className="mt-1">
                    <div 
                      className="font-display font-black text-lg sm:text-2xl tracking-tight leading-none"
                      style={{ color: candA.cor || '#152A57' }}
                    >
                      {formatPercentBR(candA.pvap)}
                    </div>
                    <div className="text-[10px] font-bold text-[#152A57]/70 font-display tabular-nums mt-0.5 truncate">
                      {candA.vap > 0 ? `${formatVotesBR(candA.vap)} votos` : (candA.vice ? `Vice: ${candA.vice}` : '0 votos')}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
                Aguardando CDN do TSE...
              </div>
            )}

            {candB ? (
              <div
                onClick={() => onSelectUf('BR')}
                className="p-2 sm:p-2.5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex items-center gap-2 sm:gap-3 shadow-xs hover:shadow-md bg-white border-slate-200 hover:border-[#152A57] group"
                style={{ borderColor: candB.cor || '#152A57' }}
                title={`Clique para ver apuração nacional: ${candB.nm}`}
              >
                <div className="relative w-16 sm:w-20 aspect-square rounded-xl overflow-hidden bg-[#DDE6F0] border shadow-inner flex-shrink-0">
                  <img
                    src={candB.avatar}
                    alt={candB.nm}
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                  />
                  <span 
                    className="absolute bottom-0 inset-x-0 text-white text-[8px] font-black text-center py-0.5 uppercase tracking-wider"
                    style={{ backgroundColor: candB.cor || '#152A57' }}
                  >
                    {candB.partido} • {candB.n}
                  </span>
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-blue-600 text-white shadow-xs">
                      2º TURNO
                    </span>
                    <span className="text-[10px] font-black text-[#152A57] font-display">{candB.n}</span>
                  </div>

                  <h4 className="font-display font-black text-xs sm:text-sm text-[#152A57] uppercase leading-tight truncate mt-0.5">
                    {candB.nm}
                  </h4>

                  <div className="mt-1">
                    <div 
                      className="font-display font-black text-lg sm:text-2xl tracking-tight leading-none"
                      style={{ color: candB.cor || '#152A57' }}
                    >
                      {formatPercentBR(candB.pvap)}
                    </div>
                    <div className="text-[10px] font-bold text-[#152A57]/70 font-display tabular-nums mt-0.5 truncate">
                      {candB.vap > 0 ? `${formatVotesBR(candB.vap)} votos` : (candB.vice ? `Vice: ${candB.vice}` : '0 votos')}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
                Aguardando CDN do TSE...
              </div>
            )}
          </div>

          {/* Barra de Disputa Proporcional Nacional */}
          <div className="w-full h-3 rounded-full overflow-hidden flex shadow-inner border border-[#B5C7D9]/60 bg-slate-200">
            {candA && candB && (candA.pvap > 0 || candB.pvap > 0) ? (
              <>
                <div 
                  className="h-full transition-all duration-500" 
                  style={{ width: `${candA.pvap}%`, backgroundColor: candA.cor || '#CC0000' }}
                  title={`${candA.nm}: ${formatPercentBR(candA.pvap)}`}
                />
                <div 
                  className="h-full transition-all duration-500" 
                  style={{ width: `${candB.pvap}%`, backgroundColor: candB.cor || '#12B24B' }}
                  title={`${candB.nm}: ${formatPercentBR(candB.pvap)}`}
                />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[9px] font-black uppercase tracking-widest text-[#152A57]/60">
                Conectado à CDN Oficial • Pleito {OFFICIAL_TSE_2026_CONFIG.codigoPleitoDefault} • 5s Polling (Tempo Real)
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. SEÇÃO APURAÇÃO PRESIDENCIAL NOS 27 ESTADOS (REAL TSE) */}
        {/* ======================================================== */}
        <div className="space-y-2 pt-2 border-t-2 border-[#B5C7D9]/50">
          <div className="flex items-center justify-between px-0.5 flex-wrap gap-1">
            <h3 className="font-display font-black text-xs uppercase tracking-wider text-[#152A57] flex items-center gap-1.5">
              <span>APURAÇÃO OFICIAL POR ESTADO (27 UFs)</span>
            </h3>
            <span className="text-[10px] font-display font-bold text-[#152A57]/70">
              {filteredStates.length} Estados ativos
            </span>
          </div>

          {/* Filtros Rápidos */}
          <div className="flex items-center gap-1 bg-white/70 p-1 rounded-xl border border-[#B5C7D9]/60">
            <button
              onClick={() => setFilterMode('TODOS')}
              className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                filterMode === 'TODOS'
                  ? 'bg-[#152A57] text-white shadow-xs'
                  : 'text-[#152A57] hover:bg-white'
              }`}
            >
              TODOS (27)
            </button>
            {candA && (
              <button
                onClick={() => setFilterMode(candA.partido)}
                className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                  filterMode === candA.partido
                    ? 'text-white shadow-xs'
                    : 'text-[#152A57] hover:bg-white'
                }`}
                style={filterMode === candA.partido ? { backgroundColor: candA.cor || '#CC0000' } : {}}
              >
                {candA.nm.split(' ')[0]} ({candA.partido})
              </button>
            )}
            {candB && (
              <button
                onClick={() => setFilterMode(candB.partido)}
                className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                  filterMode === candB.partido
                    ? 'text-white shadow-xs'
                    : 'text-[#152A57] hover:bg-white'
                }`}
                style={filterMode === candB.partido ? { backgroundColor: candB.cor || '#12B24B' } : {}}
              >
                {candB.nm.split(' ')[0]} ({candB.partido})
              </button>
            )}
          </div>

          {/* Grade dos 27 Estados */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {filteredStates.map((st) => {
              const isHovered = hoveredUf === st.uf;
              const hasVotes = st.pst > 0;

              return (
                <div
                  key={st.uf}
                  onClick={() => onSelectUf(st.uf)}
                  onMouseEnter={() => handleCardMouseEnter(st.uf)}
                  onMouseLeave={handleCardMouseLeave}
                  className={`p-1 sm:p-1.5 rounded-xl sm:rounded-2xl transition-all duration-150 cursor-pointer flex flex-col justify-between group ${
                    isHovered
                      ? 'bg-[#EBF3FC] border-2 border-[#00B4D8] ring-2 ring-[#00B4D8]/60 scale-[1.05] shadow-lg z-10'
                      : 'bg-white hover:bg-[#F0F4F8] border-2 border-[#B5C7D9]/60 hover:border-[#152A57] shadow-xs'
                  }`}
                  title={`Abrir apuração oficial em ${st.ufNome} (${st.uf}) • ${formatPercentBR(st.pst)}`}
                >
                  {/* Topo: Sigla e Status */}
                  <div className="flex items-center justify-between mb-1 px-0.5">
                    <span className="font-display font-black text-xs text-[#152A57]">
                      {st.uf}
                    </span>
                    <span className={`text-[7px] font-black px-1 rounded ${hasVotes ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-[#152A57]'}`}>
                      {hasVotes ? formatPercentBR(st.pst, 0) : '0%'}
                    </span>
                  </div>

                  {/* Foto do Líder */}
                  <div className="w-full aspect-square rounded-lg overflow-hidden bg-slate-100 mb-1 border border-slate-200">
                    {st.leader?.avatar ? (
                      <img
                        src={st.leader.avatar}
                        alt={st.ufNome}
                        className="w-full h-full object-cover object-top opacity-90 group-hover:opacity-100 transition"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-black text-[9px] text-slate-400">
                        {st.uf}
                      </div>
                    )}
                  </div>

                  {/* Percentual apurado na UF */}
                  <div className="text-center">
                    <div className="font-display font-black text-[11px] sm:text-xs leading-none text-[#152A57]">
                      {formatPercentBR(st.pst)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </aside>
  );
};
