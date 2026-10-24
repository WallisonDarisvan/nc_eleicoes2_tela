import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Clock, 
  CheckCircle2 
} from 'lucide-react';
import type { Candidate, UF, GovernorStateSummary } from '../types/election';
import { 
  fetchGovernorsSummaryList, 
  fetchLiveTseData, 
  formatPercentBR 
} from '../services/tseService';
import { getCachedOrFetchPhotoUrl } from '../services/imageDbService';

interface MapGovernorsGridSidebarProps {
  onSelectUf: (uf: UF) => void;
  onOpenMacroAnalytics?: () => void;
  hoveredUf?: UF | null;
  onHoverUf?: (uf: UF | null) => void;
}

// Subcomponente com cache de foto para carregamento instantâneo memoizado
const CandidateThumb: React.FC<{
  src: string;
  alt: string;
  className?: string;
  fallbackText?: string;
  fallbackColor?: string;
}> = React.memo(({ src, alt, className = '', fallbackText = '', fallbackColor = '#152A57' }) => {
  const [imgSrc, setImgSrc] = useState<string>(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setHasError(false);
    if (src) {
      getCachedOrFetchPhotoUrl(src)
        .then((url) => {
          if (isMounted && url) setImgSrc(url);
        })
        .catch(() => {
          if (isMounted) setImgSrc(src);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [src]);

  if (hasError || !imgSrc) {
    return (
      <div 
        className={`flex items-center justify-center font-display font-black text-white text-[10px] ${className}`}
        style={{ backgroundColor: fallbackColor }}
      >
        {fallbackText ? fallbackText.slice(0, 2).toUpperCase() : '•'}
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      onError={() => setHasError(true)}
      className={`object-cover object-top ${className}`}
      loading="lazy"
      decoding="async"
    />
  );
});

// Card individual de cada Governador com renderização memoizada de alto desempenho
interface GovernorGridCardProps {
  gov: GovernorStateSummary;
  isHovered: boolean;
  onSelectUf: (uf: UF) => void;
  onMouseEnter: (uf: UF) => void;
  onMouseLeave: () => void;
}

const GovernorGridCard: React.FC<GovernorGridCardProps> = React.memo(
  ({ gov, isHovered, onSelectUf, onMouseEnter, onMouseLeave }) => {
    const is2oTurno = gov.is2oTurno;
    const winner = gov.winner || gov.candidate1;

    return (
      <div
        onClick={() => onSelectUf(gov.uf)}
        onMouseEnter={() => onMouseEnter(gov.uf)}
        onMouseLeave={onMouseLeave}
        className={`p-1 sm:p-1.5 rounded-xl sm:rounded-2xl transition-all duration-150 cursor-pointer flex flex-col justify-between group ${
          isHovered
            ? 'bg-[#EBF3FC] border-2 border-[#00B4D8] ring-2 ring-[#00B4D8]/60 scale-[1.05] shadow-lg z-10'
            : 'bg-white hover:bg-[#F9FBFC] border-2 border-[#B5C7D9]/80 hover:border-[#152A57] shadow-xs hover:shadow-md'
        }`}
        title={`Abrir apuração completa de Governador em ${gov.ufNome} (${gov.uf})`}
      >
        {/* Topo do Card do Estado: apenas Sigla (UF) e Tag de Status */}
        <div className="flex items-center justify-between mb-1 px-0.5">
          <span
            className={`text-[9px] sm:text-[10px] font-display font-black text-white px-1 py-0.5 rounded-md flex-shrink-0 transition-colors ${
              isHovered ? 'bg-[#00838F]' : 'bg-[#152A57]'
            }`}
          >
            {gov.uf}
          </span>

          {/* Badge ELEITO ou 2º TURNO */}
          {is2oTurno ? (
            <span className="inline-flex items-center gap-0.5 text-[7px] sm:text-[8px] font-black uppercase px-1 py-0.5 rounded-full bg-[#152A57] text-white flex-shrink-0">
              <Clock className="w-1.5 h-1.5 sm:w-2 sm:h-2" />
              2º T
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 text-[7px] sm:text-[8px] font-black uppercase px-1 py-0.5 rounded-full bg-emerald-600 text-white flex-shrink-0">
              <CheckCircle2 className="w-1.5 h-1.5 sm:w-2 sm:h-2" />
              ELEITO
            </span>
          )}
        </div>

        {/* CORPO DA CAIXA: QUADRADO 1:1 FOCADO NA FOTO */}
        {is2oTurno ? (
          <div className="w-full aspect-square rounded-lg sm:rounded-xl overflow-hidden bg-[#DDE6F0] border border-[#B5C7D9]/50 shadow-inner grid grid-cols-2 relative">
            {gov.candidate1 && (
              <div className="w-full h-full overflow-hidden border-r border-white/60">
                <CandidateThumb
                  src={gov.candidate1.avatar}
                  alt={gov.candidate1.nm}
                  className="w-full h-full object-cover object-top"
                  fallbackText={gov.candidate1.nm}
                  fallbackColor={gov.candidate1.cor}
                />
              </div>
            )}
            {gov.candidate2 && (
              <div className="w-full h-full overflow-hidden">
                <CandidateThumb
                  src={gov.candidate2.avatar}
                  alt={gov.candidate2.nm}
                  className="w-full h-full object-cover object-top"
                  fallbackText={gov.candidate2.nm}
                  fallbackColor={gov.candidate2.cor}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="w-full aspect-square rounded-lg sm:rounded-xl overflow-hidden bg-[#DDE6F0] border border-[#B5C7D9]/50 shadow-inner flex items-center justify-center">
            {winner && (
              <CandidateThumb
                src={winner.avatar}
                alt={winner.nm}
                className="w-full h-full object-cover object-top"
                fallbackText={winner.nm}
                fallbackColor={winner.cor}
              />
            )}
          </div>
        )}
      </div>
    );
  }
);

export const MapGovernorsGridSidebar: React.FC<MapGovernorsGridSidebarProps> = ({
  onSelectUf,
  hoveredUf,
  onHoverUf,
}) => {
  const [governors, setGovernors] = useState<GovernorStateSummary[]>([]);
  const [presidents, setPresidents] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'TODOS' | '2º TURNO' | 'ELEITOS'>('TODOS');

  const handleCardMouseEnter = useCallback((uf: UF) => {
    onHoverUf?.(uf);
  }, [onHoverUf]);

  const handleCardMouseLeave = useCallback(() => {
    onHoverUf?.(null);
  }, [onHoverUf]);

  // Carrega candidatos presidenciais nacionais e lista completa dos 27 governadores
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [presRes, govsList] = await Promise.all([
          fetchLiveTseData('BR', 'PRESIDENTE'),
          fetchGovernorsSummaryList(),
        ]);

        if (!isMounted) return;

        if (presRes.success && presRes.data?.candidates) {
          setPresidents(presRes.data.candidates.slice(0, 2));
        }

        if (govsList && govsList.length > 0) {
          setGovernors(govsList);
        }
      } catch (err) {
        console.error('Erro ao carregar governadores do mapa:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    // Polling a cada 30 segundos
    const interval = setInterval(loadData, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Contadores
  const count2oTurno = useMemo(() => governors.filter((g) => g.is2oTurno).length, [governors]);
  const countEleitos = useMemo(() => governors.filter((g) => g.status === 'ELEITO').length, [governors]);

  // Lista filtrada
  const filteredGovernors = useMemo(() => {
    let list = [...governors];
    if (filterMode === '2º TURNO') {
      list = list.filter((g) => g.is2oTurno);
    } else if (filterMode === 'ELEITOS') {
      list = list.filter((g) => g.status === 'ELEITO');
    }
    // Ordena colocando 2º turno primeiro, depois por nome do estado
    return list.sort((a, b) => {
      if (a.is2oTurno && !b.is2oTurno) return -1;
      if (!a.is2oTurno && b.is2oTurno) return 1;
      return a.uf.localeCompare(b.uf);
    });
  }, [governors, filterMode]);

  return (
    <aside className="w-full h-full min-h-0 flex flex-col select-none flex-shrink-0 overflow-hidden pr-0.5">
      {/* Conteúdo Principal com Rolagem Suave */}
      <div className="flex-1 w-full min-h-0 overflow-y-auto space-y-2.5 sm:space-y-3 pr-1 text-[#152A57]">
        
        {/* ======================================================== */}
        {/* 1. SEÇÃO PRESIDENTE DA REPÚBLICA (2X MAIOR - 2 CAIXAS)   */}
        {/* ======================================================== */}
        <div className="space-y-1.5 flex-shrink-0">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="font-display font-black text-xs uppercase tracking-wider text-[#152A57]">
                PRESIDENTE DA REPÚBLICA
              </h3>
              <span className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#152A57] text-white shadow-xs">
                <Clock className="w-2 h-2" />
                2º TURNO
              </span>
            </div>
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-[#152A57] text-white tracking-widest shadow-xs">
              BRASIL
            </span>
          </div>

          {/* Duas Caixas de Presidente Lado a Lado com Foto e Dados à Direita */}
          <div className="grid grid-cols-2 gap-2">
            {presidents.map((cand, idx) => {
              const isFirst = idx === 0;
              return (
                <div
                  key={cand.n}
                  onClick={() => onSelectUf('BR')}
                  className={`p-2 sm:p-2.5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex items-center gap-2.5 sm:gap-3 shadow-xs hover:shadow-md group ${
                    isFirst
                      ? 'bg-gradient-to-b from-white to-[#F0F5FA] border-[#152A57] hover:border-[#1D4ED8]'
                      : 'bg-white hover:bg-[#F9FBFC] border-[#A8BED5] hover:border-[#152A57]'
                  }`}
                  title={`Clique para ver apuração nacional completa: ${cand.nm}`}
                >
                  {/* Foto no lado ESQUERDO (diminuída em 30%, aspecto 1:1 quadrado) */}
                  <div className="relative w-20 sm:w-24 aspect-square rounded-xl overflow-hidden bg-[#DDE6F0] border border-[#B5C7D9]/50 shadow-inner flex-shrink-0 flex items-center justify-center">
                    <CandidateThumb
                      src={cand.avatar}
                      alt={cand.nm}
                      className="w-full h-full object-cover object-top"
                      fallbackText={cand.nm}
                      fallbackColor={cand.cor}
                    />
                  </div>

                  {/* Dados no lado DIREITO da foto */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    {/* Topo: Posição e Partido */}
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-black text-white bg-[#152A57] px-1.5 py-0.5 rounded-md font-display">
                        {idx + 1}º
                      </span>
                      <span className="text-[10px] font-bold text-[#152A57] uppercase font-display">
                        {cand.partido} • {cand.n}
                      </span>
                    </div>

                    {/* Nome do Candidato */}
                    <h4 className="font-display font-black text-xs sm:text-sm text-[#152A57] uppercase leading-tight truncate">
                      {cand.nm}
                    </h4>

                    {/* Percentual e Votos */}
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="font-display font-black text-base sm:text-xl text-[#152A57] tracking-tight tabular-nums">
                        {formatPercentBR(cand.pvap)}
                      </span>
                      <span className="text-[9px] text-[#152A57]/60 font-bold uppercase">
                        VOTOS
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. SEÇÃO GOVERNADORES DOS ESTADOS (GRADE ELEITOS & 2º T)  */}
        {/* ======================================================== */}
        <div className="space-y-2 pt-1 border-t-2 border-[#B5C7D9]/50">
          <div className="flex items-center justify-between px-0.5 flex-wrap gap-1">
            <h3 className="font-display font-black text-xs uppercase tracking-wider text-[#152A57] flex items-center gap-1.5">
              <span>GOVERNADORES POR ESTADO</span>
            </h3>
            <span className="text-[10px] font-display font-bold text-[#152A57]/70">
              {filteredGovernors.length} UFs
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
              TODOS ({governors.length})
            </button>
            <button
              onClick={() => setFilterMode('2º TURNO')}
              className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                filterMode === '2º TURNO'
                  ? 'bg-[#152A57] text-white shadow-xs'
                  : 'text-[#152A57] hover:bg-white'
              }`}
            >
              2º TURNO ({count2oTurno})
            </button>
            <button
              onClick={() => setFilterMode('ELEITOS')}
              className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                filterMode === 'ELEITOS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-[#152A57] hover:bg-white'
              }`}
            >
              ELEITOS ({countEleitos})
            </button>
          </div>

          {/* Grade dos Estados (2 colunas) */}
          {isLoading && governors.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#152A57]/70 font-semibold animate-pulse">
              Carregando dados oficiais dos 27 governadores...
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {filteredGovernors.map((gov) => (
                <GovernorGridCard
                  key={gov.uf}
                  gov={gov}
                  isHovered={hoveredUf === gov.uf}
                  onSelectUf={onSelectUf}
                  onMouseEnter={handleCardMouseEnter}
                  onMouseLeave={handleCardMouseLeave}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </aside>
  );
};
