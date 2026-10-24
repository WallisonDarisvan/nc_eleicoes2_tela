import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { Candidate, Cargo, UF } from '../types/election';
import { CandidateCard } from './CandidateCard';

interface CandidateListProps {
  candidates: Candidate[];
  cargo: Cargo;
  uf: UF;
  totalValidos: number;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const INITIAL_PAGE_SIZE = 25;
const PAGE_STEP = 25;

export const CandidateList: React.FC<CandidateListProps> = ({
  candidates,
  cargo,
  uf,
  totalValidos,
}) => {
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_PAGE_SIZE);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reseta o limite de exibição e rola ao topo ao trocar de cargo ou estado
  useEffect(() => {
    setVisibleCount(INITIAL_PAGE_SIZE);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [cargo, uf]);

  // Se a lista for pequena (Presidente/Governador/Senador com 4-15), exibe tudo direto.
  // Se for grande (Deputado Federal/Estadual com 50-2.000), fatia para manter 60 FPS e 0ms de carga.
  const isLargeList = candidates.length > INITIAL_PAGE_SIZE;
  const visibleCandidates = useMemo(() => {
    if (!isLargeList) return candidates;
    return candidates.slice(0, visibleCount);
  }, [candidates, isLargeList, visibleCount]);

  const maxPercent = candidates.length > 0 ? candidates[0].pvap : 0;
  const hasMore = isLargeList && visibleCount < candidates.length;

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PAGE_STEP, candidates.length));
  }, [candidates.length]);

  // Carregamento automático suave quando o usuário ou apresentador rola próximo do fim da lista
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el || !hasMore) return;
    const distanceToBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
    if (distanceToBottom < 200) {
      handleLoadMore();
    }
  }, [hasMore, handleLoadMore]);

  return (
    <div className="flex-1 w-full h-full min-h-0 flex flex-col">
      {/* Main Candidate Cards Stack - scroll otimizado e virtualizado por fatia */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-2 pb-2"
      >
        <AnimatePresence mode="popLayout">
          {visibleCandidates.map((candidate, index) => (
            <CandidateCard
              key={`${candidate.n}-${candidate.nm}`}
              candidate={candidate}
              cargo={cargo}
              isNational={uf === 'BR'}
              rank={index + 1}
              maxPercent={maxPercent}
              totalValidos={totalValidos}
            />
          ))}
        </AnimatePresence>

        {/* Rodapé de navegação para listas grandes (Deputado Federal / Estadual) */}
        {isLargeList && (
          <div className="pt-2 pb-1 flex flex-col items-center justify-center gap-1.5 text-center">
            {hasMore ? (
              <button
                onClick={handleLoadMore}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-white/90 hover:bg-[#152A57] text-[#152A57] hover:text-white text-xs font-black uppercase tracking-wider border border-[#A8BED5]/60 shadow-sm transition hover:scale-105 active:scale-95 group"
              >
                <span>Carregar mais candidatos (+{PAGE_STEP})</span>
                <ChevronDown className="w-4 h-4 text-[#152A57] group-hover:text-white" />
              </button>
            ) : (
              <span className="text-[11px] font-bold text-[#152A57]/70 uppercase tracking-wider bg-white/60 px-4 py-1.5 rounded-xl border border-[#A8BED5]/40">
                Todos os {candidates.length} candidatos listados
              </span>
            )}
            <span className="text-[10px] text-[#152A57]/60 font-semibold">
              Exibindo {visibleCandidates.length} de {candidates.length} apurados
            </span>
          </div>
        )}

        {candidates.length === 0 && (
          <div className="bg-white/80 rounded-2xl p-8 text-center border border-dashed border-[#A8BED5]/50">
            <p className="text-[#152A57] font-semibold text-xs">
              Nenhum candidato encontrado na apuração oficial.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
