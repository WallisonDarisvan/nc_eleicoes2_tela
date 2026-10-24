import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, CheckCircle2, Clock } from 'lucide-react';
import type { Candidate, Cargo } from '../types/election';
import { formatPercentBR, formatVotesBR } from '../services/tseService';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import { getCachedOrFetchPhotoUrl } from '../services/imageDbService';

interface CandidateCardProps {
  candidate: Candidate;
  cargo?: Cargo;
  isNational?: boolean;
  rank?: number;
  maxPercent?: number;
  totalValidos?: number;
}

export const CandidateCard: React.FC<CandidateCardProps> = React.memo(({
  candidate,
  cargo,
  isNational = false,
}) => {
  const animatedVotes = useAnimatedNumber(candidate.vap, 600);
  const animatedPercent = useAnimatedNumber(candidate.pvap, 600);
  const [imgSrc, setImgSrc] = useState<string>(candidate.avatar);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setImgError(false);

    if (candidate.avatar) {
      getCachedOrFetchPhotoUrl(candidate.avatar)
        .then((url) => {
          if (isMounted && url) {
            setImgSrc(url);
          }
        })
        .catch(() => {
          if (isMounted) setImgSrc(candidate.avatar);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [candidate.avatar]);

  // Status badge config
  const getStatusBadge = () => {
    // Regra Fundamental: Se for eleição de PRESIDENTE e NÃO for a apuração Nacional (BR),
    // em hipótese alguma deve exibir "MATEMATICAMENTE ELEITO" ou "ELEITO",
    // pois a vitória presidencial é estritamente a nível Brasil
    if (cargo === 'PRESIDENTE' && !isNational) {
      if (candidate.st === '2º TURNO') {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#152A57] text-white shadow-sm">
            <Clock className="w-3 h-3" />
            2º TURNO
          </span>
        );
      }
      return null;
    }

    switch (candidate.st) {
      case 'ELEITO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-600 text-white shadow-sm animate-pulse">
            <CheckCircle2 className="w-3 h-3" />
            ELEITO
          </span>
        );
      case 'MATEMATICAMENTE ELEITO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-amber-400 text-slate-950 shadow-sm">
            <Trophy className="w-3 h-3" />
            MATEMATICAMENTE ELEITO
          </span>
        );
      case '2º TURNO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#152A57] text-white shadow-sm">
            <Clock className="w-3 h-3" />
            2º TURNO
          </span>
        );
      default:
        return null;
    }
  };

  // Avatar Initials fallback
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Progress relative to candidate percentage or 100%
  const progressWidth = Math.min(100, Math.max(0, candidate.pvap));

  // Party accent color for left vertical pill bar
  const partyColor = candidate.cor || '#152A57';

  return (
    <motion.div
      layout
      layoutId={`cand-${candidate.n}-${candidate.nm}`}
      transition={{
        type: 'spring',
        stiffness: 350,
        damping: 30,
      }}
      className="relative w-full rounded-2xl sm:rounded-3xl transition-all duration-200 bg-white/90 hover:bg-white border-2 border-[#A8BED5] hover:border-[#152A57] shadow-sm p-3 sm:p-4 select-none"
    >
      <div className="flex items-center justify-between gap-3 sm:gap-6">
        
        {/* Left Side: Vertical Party Color Strip + Candidate Photo */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Vertical party color accent pill (matching screenshot) */}
          <div
            className="w-1.5 sm:w-2 self-stretch rounded-full flex-shrink-0 transition-colors"
            style={{ backgroundColor: partyColor }}
            title={`Partido: ${candidate.partido}`}
          />

          {/* Candidate Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm flex items-center justify-center bg-[#DDE6F0] border border-[#A8BED5]/50">
              {!imgError ? (
                <img
                  src={imgSrc}
                  alt={candidate.nm}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center font-display font-bold text-base sm:text-lg text-white"
                  style={{ backgroundColor: partyColor }}
                >
                  {getInitials(candidate.nm)}
                </div>
              )}
            </div>

            {/* Número Eleitoral (discreto) */}
            <div
              className="absolute -bottom-1.5 -right-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-black text-white shadow-sm"
              style={{ backgroundColor: partyColor }}
            >
              {candidate.n}
            </div>
          </div>
        </div>

        {/* Center: Candidate Name | Party, Votos Absolutos, Progress Bar (matching screenshot) */}
        <div className="flex-1 min-w-0 pr-2">
          {/* Line 1: Name and Party + Status Badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-black text-xs sm:text-sm md:text-base text-[#152A57] uppercase tracking-wide truncate max-w-full">
              {candidate.nm}{' '}
              <span className="text-[#1D4ED8] font-normal mx-0.5">|</span>{' '}
              <span className="text-[#152A57] font-bold">{candidate.partido}</span>
            </h3>
            {getStatusBadge()}
          </div>

          {/* Line 2: Votos Absolutos */}
          <div className="font-display font-black text-xs sm:text-sm md:text-base text-[#152A57] tracking-tight mt-0.5">
            {formatVotesBR(animatedVotes)} <span className="font-bold text-[11px] sm:text-xs text-[#152A57]/80 uppercase">VOTOS ABSOLUTOS</span>
          </div>

          {/* Line 3: Horizontal Progress Bar (matching screenshot) */}
          <div className="mt-1.5 w-full max-w-lg h-2 sm:h-2.5 bg-white rounded-full overflow-hidden border border-[#A8BED5]/50 shadow-inner">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#152A57] to-[#1D4ED8]"
              initial={{ width: 0 }}
              animate={{ width: `${progressWidth}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Right Side: Huge Percentage */}
        <div className="flex-shrink-0 text-right pl-2 sm:pl-3 flex items-center justify-end">
          <div className="font-display font-black text-xl sm:text-2xl md:text-3xl lg:text-4xl text-[#152A57] tracking-tight tabular-numbers whitespace-nowrap">
            {formatPercentBR(animatedPercent)}
          </div>
        </div>

      </div>
    </motion.div>
  );
});

CandidateCard.displayName = 'CandidateCard';
