import React, { useMemo } from 'react';
import { RotateCw, Radio } from 'lucide-react';
import type { Candidate, ElectionStats, Region, UF } from '../types/election';
import { BrazilMap } from './BrazilMap';
import { formatPercentBR, formatVotesBR } from '../services/tseService';

interface PresidentialDuelStageProps {
  currentUf?: UF;
  selectedRegion?: Region | null;
  onSelectRegion?: (region: Region | null) => void;
  onSelectUf: (uf: UF) => void;
  hoveredUf?: UF | null;
  onHoverUf?: (uf: UF | null) => void;
  candidates?: Candidate[];
  stats?: ElectionStats;
  isLoading?: boolean;
  onRefreshTse?: () => void;
}

export const PresidentialDuelStage: React.FC<PresidentialDuelStageProps> = ({
  currentUf = 'BR',
  selectedRegion = null,
  onSelectRegion,
  onSelectUf,
  hoveredUf,
  onHoverUf,
  candidates,
  stats,
  isLoading = false,
  onRefreshTse,
}) => {
  const effectiveCandidates = useMemo(() => {
    return candidates && candidates.length > 0 ? candidates : [];
  }, [candidates]);

  const candLula = useMemo(() => {
    return effectiveCandidates.find((c) => c.n === '13') || effectiveCandidates[0] || null;
  }, [effectiveCandidates]);

  const candFlavio = useMemo(() => {
    return effectiveCandidates.find((c) => c.n === '22') || effectiveCandidates[1] || null;
  }, [effectiveCandidates]);

  // Cálculos dinâmicos das porcentagens para o Quadro de Votos
  const totalVotosComputados = (stats?.votosValidos || 0) + (stats?.votosBrancos || 0) + (stats?.votosNulos || 0);
  const validosPercent = totalVotosComputados > 0 
    ? ((stats?.votosValidos || 0) / totalVotosComputados) * 100 
    : 0;
  const brancosPercent = totalVotosComputados > 0 
    ? ((stats?.votosBrancos || 0) / totalVotosComputados) * 100 
    : 0;
  const nulosPercent = totalVotosComputados > 0 
    ? ((stats?.votosNulos || 0) / totalVotosComputados) * 100 
    : 0;
  const totalEleitores = stats?.totalEleitores || 0;
  const abstencaoPercent = totalEleitores > 0 
    ? ((stats?.abstencao || 0) / totalEleitores) * 100 
    : 0;

  // Lógica da disputa: Líder e Diferença de Votos
  const lulaVap = candLula?.vap || 0;
  const flavioVap = candFlavio?.vap || 0;
  const lulaPvap = candLula?.pvap || 0;
  const flavioPvap = candFlavio?.pvap || 0;

  const diffVotos = Math.abs(lulaVap - flavioVap);
  const diffPercent = Math.abs(lulaPvap - flavioPvap);

  const isLulaLider = lulaVap > flavioVap;
  const isFlavioLider = flavioVap > lulaVap;
  const hasVotos = lulaVap > 0 || flavioVap > 0;

  const liderNome = isLulaLider ? 'LULA' : isFlavioLider ? 'FLÁVIO' : '';
  const liderCor = isLulaLider ? '#CC0000' : isFlavioLider ? '#12B24B' : '#64748B';

  // Verifica se a apuração atingiu 100% das urnas
  const isApuracaoCompleta = (stats?.pst || 0) >= 100;

  return (
    <div className="w-full h-full min-h-0 flex flex-col lg:flex-row gap-3.5 xl:gap-4 items-stretch justify-between select-none relative overflow-hidden">
      
      {/* ======================================================== */}
      {/* 1. LADO ESQUERDO: O MAPA DO BRASIL GRANDE E IMPONENTE     */}
      {/* ======================================================== */}
      <div className="flex-1 h-full min-w-0 flex flex-col items-center justify-center relative px-1 lg:px-2">
        <div className="w-full h-full min-h-0 flex items-center justify-center relative">
          <BrazilMap
            selectedRegion={selectedRegion}
            selectedUf={currentUf}
            currentCargo="PRESIDENTE"
            hoveredUf={hoveredUf}
            onHoverUf={onHoverUf}
            onSelectRegion={onSelectRegion}
            onSelectUf={onSelectUf}
          />
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. LADO DIREITO: COLUNA INTEGRADA (DUELO + QUADRO VOTOS) */}
      {/* ======================================================== */}
      <div className="w-full lg:w-[350px] xl:w-[380px] 2xl:w-[410px] flex-shrink-0 flex flex-col justify-center gap-2.5 sm:gap-3 h-full overflow-hidden">
        
        {/* Cabeçalho de Urnas Apuradas (Fiel ao mockup oficial) */}
        <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl px-3.5 py-2 border border-slate-200/90 shadow-md flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshTse}
              disabled={isLoading}
              title="Sincronizar dados oficiais com a CDN do TSE"
              className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#152A57] border border-slate-300/70 transition shadow-xs flex items-center justify-center cursor-pointer active:scale-95"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#1D4ED8]' : 'text-[#152A57]'}`} />
            </button>
            <span className="flex items-center gap-1.5 text-xs font-black text-[#152A57] tracking-wider uppercase font-display">
              <Radio className="w-3 h-3 text-[#1D4ED8] animate-pulse" />
              URNAS APURADAS:
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-black text-[#152A57] font-display tabular-nums leading-none">
              {formatPercentBR(stats?.pst || 0)}
            </span>
            <span className="text-[10px] font-black tracking-wider text-[#152A57]/70 uppercase font-display">
              FONTE: TSE
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* A. BLOCO DO DUELO: LULA E FLÁVIO NO MESMO BLOCO           */}
        {/* ======================================================== */}
        <div 
          onClick={() => {
            onSelectRegion?.(null);
            onSelectUf('BR');
          }}
          className="w-full bg-white/95 backdrop-blur-md rounded-3xl p-3 sm:p-4 shadow-xl border border-slate-200/90 flex flex-col justify-between cursor-pointer group"
          title="Clique para voltar à apuração nacional de Presidente (Brasil)"
        >
          {/* Topo: Badges dos dois candidatos e 2º Turno */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="bg-[#CC0000] text-white font-display font-black text-xs px-2.5 py-1 rounded-xl shadow-xs uppercase tracking-wider">
              {candLula?.partido || 'PT'} • {candLula?.n || '13'}
            </span>
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-[#152A57] text-white tracking-widest inline-flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {currentUf && currentUf !== 'BR' 
                ? `2º T • ${currentUf}` 
                : selectedRegion 
                ? `2º T • ${selectedRegion}` 
                : '2º TURNO'}
            </span>
            <span className="bg-[#12B24B] text-white font-display font-black text-xs px-2.5 py-1 rounded-xl shadow-xs uppercase tracking-wider">
              {candFlavio?.partido || 'PL'} • {candFlavio?.n || '22'}
            </span>
          </div>

          {/* Grid com os 2 Candidatos lado a lado */}
          <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
            
            {/* Coluna Lula */}
            <div className="flex flex-col">
              {/* Foto do Candidato */}
              <div className="w-full aspect-[4/4.4] rounded-2xl overflow-hidden bg-[#DDE6F0] border-2 border-[#CC0000] shadow-sm relative">
                {candLula?.avatar ? (
                  <img
                    src={candLula.avatar}
                    alt={candLula.nm}
                    className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
                    loading="eager"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-display font-black text-slate-400">
                    LULA
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-1.5 text-white">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-200 block truncate">
                    {candLula?.vice ? `Vice: ${candLula.vice}` : 'VICE: GERALDO ALCKMIN'}
                  </span>
                </div>
              </div>

              {/* Nome do Candidato */}
              <h2 className="font-display font-black text-base text-[#152A57] uppercase tracking-tight mt-2 truncate">
                LULA
              </h2>

              {/* Linha Divisória */}
              <div className="border-t border-slate-200 mt-1 pt-1.5" />

              {/* Porcentagem e Votos */}
              <span className="font-display font-black text-3xl sm:text-4xl text-[#CC0000] tracking-tight leading-none block tabular-nums">
                {formatPercentBR(candLula?.pvap || 0)}
              </span>
              <span className="text-[11px] font-bold text-[#152A57] font-display tabular-nums block mt-0.5">
                {formatVotesBR(candLula?.vap || 0)} votos
              </span>

              {/* Barra de Progresso */}
              <div className="w-full h-1.5 rounded-full overflow-hidden bg-slate-200 mt-1.5">
                <div 
                  className="h-full bg-[#CC0000] transition-all duration-500 rounded-full"
                  style={{ width: `${candLula?.pvap || 0}%` }}
                />
              </div>
            </div>

            {/* Coluna Flávio Bolsonaro */}
            <div className="flex flex-col">
              {/* Foto do Candidato */}
              <div className="w-full aspect-[4/4.4] rounded-2xl overflow-hidden bg-[#DDE6F0] border-2 border-[#12B24B] shadow-sm relative">
                {candFlavio?.avatar ? (
                  <img
                    src={candFlavio.avatar}
                    alt={candFlavio.nm}
                    className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
                    loading="eager"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-display font-black text-slate-400">
                    FLÁVIO
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-1.5 text-white">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-200 block truncate">
                    {candFlavio?.vice ? `Vice: ${candFlavio.vice}` : 'VICE: ALFREDO GASPAR'}
                  </span>
                </div>
              </div>

              {/* Nome do Candidato */}
              <h2 className="font-display font-black text-base text-[#152A57] uppercase tracking-tight mt-2 truncate">
                FLAVIO BOLSONARO
              </h2>

              {/* Linha Divisória */}
              <div className="border-t border-slate-200 mt-1 pt-1.5" />

              {/* Porcentagem e Votos */}
              <span className="font-display font-black text-3xl sm:text-4xl text-[#12B24B] tracking-tight leading-none block tabular-nums">
                {formatPercentBR(candFlavio?.pvap || 0)}
              </span>
              <span className="text-[11px] font-bold text-[#152A57] font-display tabular-nums block mt-0.5">
                {formatVotesBR(candFlavio?.vap || 0)} votos
              </span>

              {/* Barra de Progresso */}
              <div className="w-full h-1.5 rounded-full overflow-hidden bg-slate-200 mt-1.5">
                <div 
                  className="h-full bg-[#12B24B] transition-all duration-500 rounded-full"
                  style={{ width: `${candFlavio?.pvap || 0}%` }}
                />
              </div>
            </div>

          </div>
        </div>

        {/* ======================================================== */}
        {/* B. BLOCO QUADRO DE VOTOS (OFICIAL TSE)                   */}
        {/* ======================================================== */}
        <div className="w-full bg-[#E8EEF5]/70 backdrop-blur-md rounded-3xl p-3 sm:p-3.5 shadow-lg border border-[#A8BED5]/50 flex flex-col gap-2">
          
          {/* Cabeçalho do Quadro */}
          <div className="flex items-center justify-between mb-0.5">
            <h3 className="font-display font-black text-xs sm:text-sm text-[#152A57] tracking-wider uppercase">
              QUADRO DE VOTOS
            </h3>
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-lg bg-white border border-[#A8BED5]/60 text-[#152A57] shadow-xs font-display tracking-wider">
              OFICIAL TSE
            </span>
          </div>

          {/* Lista dos 4 Cards */}
          <div className="flex flex-col gap-1.5 sm:gap-2">
            
            {/* 1. Votos Válidos */}
            <div className="bg-white rounded-2xl px-3 py-2 border border-slate-200/60 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-black text-[#152A57] uppercase tracking-wide">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  VOTOS VÁLIDOS
                </span>
                <span className="font-display font-black text-xs sm:text-sm text-emerald-600 tabular-nums">
                  {formatPercentBR(validosPercent)}
                </span>
              </div>
              <div className="text-sm sm:text-base font-black text-[#152A57] font-display tabular-nums mt-0.5">
                {formatVotesBR(stats?.votosValidos || 0)}
              </div>
            </div>

            {/* 2. Votos Brancos */}
            <div className="bg-white rounded-2xl px-3 py-2 border border-slate-200/60 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-black text-[#152A57] uppercase tracking-wide">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                  VOTOS BRANCOS
                </span>
                <span className="font-display font-black text-xs sm:text-sm text-amber-600 tabular-nums">
                  {formatPercentBR(brancosPercent)}
                </span>
              </div>
              <div className="text-sm sm:text-base font-black text-[#152A57] font-display tabular-nums mt-0.5">
                {formatVotesBR(stats?.votosBrancos || 0)}
              </div>
            </div>

            {/* 3. Votos Nulos */}
            <div className="bg-white rounded-2xl px-3 py-2 border border-slate-200/60 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-black text-[#152A57] uppercase tracking-wide">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0" />
                  VOTOS NULOS
                </span>
                <span className="font-display font-black text-xs sm:text-sm text-rose-600 tabular-nums">
                  {formatPercentBR(nulosPercent)}
                </span>
              </div>
              <div className="text-sm sm:text-base font-black text-[#152A57] font-display tabular-nums mt-0.5">
                {formatVotesBR(stats?.votosNulos || 0)}
              </div>
            </div>

            {/* 4. Diferença de Votos (Durante a apuração) OU Abstenção Oficial (Ao concluir 100%) */}
            <div className="bg-white rounded-2xl px-3 py-2 border border-slate-200/60 shadow-xs flex flex-col justify-between">
              {isApuracaoCompleta ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[11px] font-black text-[#152A57] uppercase tracking-wide">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-500 flex-shrink-0" />
                      ABSTENÇÃO OFICIAL
                    </span>
                    <span className="font-display font-black text-xs sm:text-sm text-slate-700 tabular-nums">
                      {formatPercentBR(abstencaoPercent)}
                    </span>
                  </div>
                  <div className="text-sm sm:text-base font-black text-[#152A57] font-display tabular-nums mt-0.5">
                    {formatVotesBR(stats?.abstencao || 0)} eleitores
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[11px] font-black text-[#152A57] uppercase tracking-wide">
                      <span 
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: liderCor }}
                      />
                      {hasVotos && liderNome ? `DIFERENÇA (${liderNome})` : 'DIFERENÇA DE VOTOS'}
                    </span>
                    <span 
                      className="font-display font-black text-xs sm:text-sm tabular-nums"
                      style={{ color: hasVotos && liderNome ? liderCor : '#64748B' }}
                    >
                      {hasVotos ? `+${formatPercentBR(diffPercent)}` : '0,00%'}
                    </span>
                  </div>
                  <div className="text-sm sm:text-base font-black text-[#152A57] font-display tabular-nums mt-0.5 flex items-baseline justify-between">
                    <span>
                      {hasVotos ? `+${formatVotesBR(diffVotos)} votos` : '0 votos'}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-sans">
                      EM DISPUTA
                    </span>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
