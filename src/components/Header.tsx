import React from 'react';
import { 
  RotateCw, 
  Radio
} from 'lucide-react';
import type { Cargo, ElectionStats, Region, UF } from '../types/election';
import { formatPercentBR } from '../services/tseService';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import { UFS_INFO } from '../data/regionsAndUfs';

interface HeaderProps {
  cargo?: Cargo;
  uf: UF;
  regionName?: Region | null;
  isMapScreen?: boolean;
  stats: ElectionStats;
  isFullscreen?: boolean;
  isLoading: boolean;
  onToggleFullscreen?: () => void;
  onRefreshTse: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cargo: _cargo,
  uf,
  regionName,
  isMapScreen = false,
  stats,
  isLoading,
  onRefreshTse,
}) => {
  const animatedPst = useAnimatedNumber(stats.pst, 400);

  return (
    <header className="w-full flex-shrink-0 bg-[#E8EEF5]/85 backdrop-blur-md border-b border-[#A8BED5]/50 px-6 sm:px-12 lg:px-16 xl:px-24 2xl:px-28 pt-4 sm:pt-6 pb-3 sm:pb-3.5 select-none shadow-sm">
      <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        
        {/* Left: Broadcast Title with NC Eleições Logo before "MAPA ELEITORAL" */}
        <div className="flex items-center gap-3 sm:gap-4">
          <img
            src="/logo-nc-eleicoes.png"
            alt="NC Eleições"
            className="h-8 sm:h-10 md:h-11 w-auto object-contain select-none drop-shadow-sm"
          />
          <div className="h-7 sm:h-8 w-[2px] bg-[#A8BED5]/70 hidden sm:block" />
          <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-[#152A57] tracking-tight uppercase flex items-center flex-wrap gap-y-1">
            {isMapScreen ? (
              <>
                <span>MAPA ELEITORAL</span>
                <span className="text-[#1D4ED8] mx-2 font-normal">|</span>
                <span className="text-[#1D4ED8] font-black">
                  {uf !== 'BR'
                    ? (UFS_INFO[uf]?.nome?.toUpperCase() || uf)
                    : regionName
                    ? regionName
                    : 'BRASIL'}
                </span>
              </>
            ) : (
              <>
                <span>PRESIDENTE DA REPÚBLICA</span>
                <span className="text-[#1D4ED8] mx-2 font-normal">|</span>
                <span className="text-[#1D4ED8] font-black">{regionName ? regionName : (uf === 'BR' ? 'BRASIL' : uf)}</span>
              </>
            )}
            <span className="text-xs font-black uppercase px-3 py-1 rounded-full bg-[#152A57] text-white shadow-xs ml-2 inline-flex items-center gap-1.5 align-middle">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              2º TURNO OFICIAL
            </span>
          </h1>
        </div>

        {/* Right: Urnas Apuradas Bar & Fonte TSE */}
        <div className="w-full md:w-auto flex flex-col items-start md:items-end min-w-[280px]">
          {/* Label + Refresh button + Percentage */}
          <div className="w-full flex items-center justify-between md:justify-end gap-2.5 text-xs sm:text-sm font-black text-[#152A57] tracking-wider uppercase font-display">
            <button
              onClick={onRefreshTse}
              disabled={isLoading}
              title="Sincronizar dados oficiais com a CDN do TSE"
              className="p-1 rounded-lg bg-white/80 hover:bg-white text-[#152A57] border border-[#A8BED5]/60 transition shadow-xs hover:scale-105 active:scale-95 flex items-center justify-center"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#1D4ED8]' : 'text-[#152A57]'}`} />
            </button>
            <span className="flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-[#1D4ED8] animate-pulse" />
              URNAS APURADAS:
            </span>
            <span className="text-base sm:text-lg text-[#152A57] font-black">
              {formatPercentBR(animatedPst)}
            </span>
          </div>

          {/* Horizontal Progress Bar (matching screenshot) */}
          <div className="w-full md:w-72 h-2.5 sm:h-3 bg-white/80 rounded-full overflow-hidden border border-[#A8BED5]/50 mt-1 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-[#152A57] to-[#1D4ED8] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, stats.pst))}%` }}
            />
          </div>

          {/* Source Credit (matching screenshot) */}
          <div className="text-[10px] font-black tracking-widest text-[#152A57]/80 uppercase mt-1">
            FONTE: TSE
          </div>
        </div>

      </div>
    </header>
  );
};
