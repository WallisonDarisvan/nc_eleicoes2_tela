import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, Loader2, MapPin } from 'lucide-react';
import type { Cargo, Region, UF, PresidentStateSummary } from '../types/election';
import { UFS_INFO, REGIONS_DATA } from '../data/regionsAndUfs';
import { BRAZIL_GEO_STATES } from '../data/brazilGeoData';
import { formatPercentBR, prefetchLiveTseData, fetchPresidentStatesSummaryList } from '../services/tseService';
import { fetchStateMunicipalities, type StateMunicipalityData } from '../services/municipalityService';

interface BrazilMapProps {
  selectedRegion?: Region | null;
  selectedUf?: UF | null;
  currentCargo?: Cargo;
  hoveredUf?: UF | null;
  onHoverUf?: (uf: UF | null) => void;
  onSelectRegion?: (region: Region | null) => void;
  onSelectUf: (uf: UF) => void;
}

// Bounding box e viewBox exatos para centralizar cada região
const REGION_VIEWBOXES: Record<Region, string> = {
  'NORTE': '25 20 610 425',
  'NORDESTE': '538 150 315 390',
  'CENTRO-OESTE': '275 275 355 390',
  'SUDESTE': '450 420 305 270',
  'SUL': '350 595 240 295',
};
const DEFAULT_VIEWBOX = '80 50 820 850';

// Centros geométricos aproximados para os badges das 5 Regiões no Nível 1
const REGION_CENTERS: Record<Region, { x: number; y: number; label: string }> = {
  'NORTE': { x: 330, y: 240, label: 'NORTE' },
  'NORDESTE': { x: 700, y: 320, label: 'NORDESTE' },
  'CENTRO-OESTE': { x: 450, y: 470, label: 'CENTRO-OESTE' },
  'SUDESTE': { x: 620, y: 560, label: 'SUDESTE' },
  'SUL': { x: 470, y: 730, label: 'SUL' },
};

// Calibração do tamanho do texto da sigla para harmonia visual
const FONT_SIZES: Partial<Record<UF, number>> = {
  AM: 18,
  PA: 18,
  MT: 18,
  MG: 17,
  BA: 18,
  RS: 15,
  GO: 15,
  MS: 15,
  MA: 14,
  TO: 14,
  PI: 14,
  PR: 13,
  SC: 13,
  RO: 13,
  AC: 13,
  RR: 13,
  AP: 13,
  SP: 14,
  CE: 12,
  RN: 11,
  PB: 11,
  PE: 12,
  AL: 10,
  SE: 10,
  ES: 11,
  RJ: 11,
  DF: 10,
};

export const BrazilMap: React.FC<BrazilMapProps> = React.memo(({
  selectedRegion,
  selectedUf,
  currentCargo = 'PRESIDENTE',
  hoveredUf,
  onHoverUf,
  onSelectRegion,
  onSelectUf,
}) => {
  const [internalHoveredRegion, setInternalHoveredRegion] = useState<Region | null>(null);
  const [internalHoveredUf, setInternalHoveredUf] = useState<UF | null>(null);
  const [statesSummaryMap, setStatesSummaryMap] = useState<Partial<Record<UF, PresidentStateSummary>>>({});

  // Nível 3: Malha vetorial e nomes dos municípios do estado selecionado
  const [municipalityData, setMunicipalityData] = useState<StateMunicipalityData | null>(null);
  const [isLoadingMunicipalities, setIsLoadingMunicipalities] = useState<boolean>(false);
  const [hoveredMun, setHoveredMun] = useState<{ id: string; nome: string; leader?: string; pvap?: number } | null>(null);

  // Atualização em tempo real dos 27 estados diretamente da CDN do TSE
  useEffect(() => {
    let isMounted = true;
    const updateStates = async () => {
      try {
        const list = await fetchPresidentStatesSummaryList();
        if (isMounted && list.length > 0) {
          const map: Partial<Record<UF, PresidentStateSummary>> = {};
          list.forEach((s) => {
            map[s.uf] = s;
          });
          setStatesSummaryMap(map);
        }
      } catch {
        // Silencioso
      }
    };

    updateStates();
    const timer = setInterval(updateStates, 5000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  const stateKeys: UF[] = [
    'AM', 'PA', 'MT', 'MG', 'BA', 'GO', 'MS', 'MA', 'TO', 'PI', 'RS', 'PR', 'SC',
    'RO', 'AC', 'RR', 'AP', 'SP', 'CE', 'RN', 'PB', 'PE', 'AL', 'SE', 'ES', 'RJ', 'DF'
  ];

  const activeSelectedUf = selectedUf && selectedUf !== 'BR' ? selectedUf : null;
  const activeRegion: Region | null = (activeSelectedUf ? UFS_INFO[activeSelectedUf]?.regiao : null) || selectedRegion || null;

  // Carrega municípios quando um estado for selecionado (Nível 3)
  useEffect(() => {
    let isMounted = true;
    if (activeSelectedUf) {
      setIsLoadingMunicipalities(true);
      fetchStateMunicipalities(activeSelectedUf).then((data) => {
        if (isMounted) {
          setMunicipalityData(data);
          setIsLoadingMunicipalities(false);
        }
      });
    } else {
      setMunicipalityData(null);
      setIsLoadingMunicipalities(false);
      setHoveredMun(null);
    }
    return () => {
      isMounted = false;
    };
  }, [activeSelectedUf]);

  // Determina o nível de exibição:
  // 'national' -> Nível 1: Brasil por Regiões
  // 'regional' -> Nível 2: Região por Estados
  // 'state'    -> Nível 3: Estado por Municípios
  const currentLevel: 'national' | 'regional' | 'state' = activeSelectedUf
    ? 'state'
    : activeRegion
    ? 'regional'
    : 'national';

  const effectiveHoveredUf = hoveredUf !== undefined ? hoveredUf : internalHoveredUf;
  const effectiveHoveredRegion = internalHoveredRegion;

  const activeHoverUf = effectiveHoveredUf;
  const activeGeo = activeHoverUf ? BRAZIL_GEO_STATES[activeHoverUf] : null;
  const activeInfo = activeHoverUf ? UFS_INFO[activeHoverUf] : null;
  const activeStateSummary = activeHoverUf ? statesSummaryMap[activeHoverUf] : null;

  // ========================================================
  // CÁLCULO DE LIDERANÇA POR REGIÃO (NÍVEL 1)
  // Lula (PT • 13) -> Vermelho (#CC0000)
  // Flávio Bolsonaro (PL • 22) -> Azul (#1A365D / #1D4ED8)
  // Sem apuração -> Neutro (#243B5A)
  // ========================================================
  const regionLeaders = useMemo(() => {
    const map: Record<Region, { leader: 'LULA' | 'BOLSONARO' | 'NONE'; color: string; hoverColor: string; lulaVap: number; bolsonaroVap: number; totalVap: number }> = {
      'NORTE': { leader: 'NONE', color: '#243B5A', hoverColor: '#32527B', lulaVap: 0, bolsonaroVap: 0, totalVap: 0 },
      'NORDESTE': { leader: 'NONE', color: '#243B5A', hoverColor: '#32527B', lulaVap: 0, bolsonaroVap: 0, totalVap: 0 },
      'CENTRO-OESTE': { leader: 'NONE', color: '#243B5A', hoverColor: '#32527B', lulaVap: 0, bolsonaroVap: 0, totalVap: 0 },
      'SUDESTE': { leader: 'NONE', color: '#243B5A', hoverColor: '#32527B', lulaVap: 0, bolsonaroVap: 0, totalVap: 0 },
      'SUL': { leader: 'NONE', color: '#243B5A', hoverColor: '#32527B', lulaVap: 0, bolsonaroVap: 0, totalVap: 0 },
    };

    (Object.keys(REGIONS_DATA) as Region[]).forEach((reg) => {
      const ufs = REGIONS_DATA[reg];
      let sumLula = 0;
      let sumBolsonaro = 0;

      ufs.forEach((uf) => {
        const s = statesSummaryMap[uf];
        if (s && s.leader && s.second) {
          if (s.leader.vap > 0 || s.second.vap > 0) {
            if (s.leader.n === '13' || s.leader.partido === 'PT') {
              sumLula += s.leader.vap;
              sumBolsonaro += s.second.vap;
            } else if (s.leader.n === '22' || s.leader.partido === 'PL') {
              sumBolsonaro += s.leader.vap;
              sumLula += s.second.vap;
            }
          }
        }
      });

      const total = sumLula + sumBolsonaro;
      if (total > 0 && sumLula !== sumBolsonaro) {
        if (sumLula > sumBolsonaro) {
          map[reg] = {
            leader: 'LULA',
            color: '#CC0000',
            hoverColor: '#E53935',
            lulaVap: sumLula,
            bolsonaroVap: sumBolsonaro,
            totalVap: total,
          };
        } else {
          map[reg] = {
            leader: 'BOLSONARO',
            color: '#1A365D',
            hoverColor: '#1D4ED8',
            lulaVap: sumLula,
            bolsonaroVap: sumBolsonaro,
            totalVap: total,
          };
        }
      }
    });

    return map;
  }, [statesSummaryMap]);

  // Navegação pelos breadcrumbs
  const handleGoToNational = () => {
    onSelectRegion?.(null);
    onSelectUf('BR');
  };

  const handleGoToRegion = (reg: Region) => {
    onSelectRegion?.(reg);
    onSelectUf('BR');
  };

  // Clique em elemento no mapa
  const handleMapElementClick = (uf: UF, regionOfState: Region) => {
    if (currentLevel === 'national') {
      onSelectRegion?.(regionOfState);
      onSelectUf('BR');
    } else if (currentLevel === 'regional') {
      onSelectUf(uf);
    }
  };

  const currentViewBox = currentLevel === 'regional' && activeRegion
    ? REGION_VIEWBOXES[activeRegion]
    : DEFAULT_VIEWBOX;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-2 relative select-none">
      
      {/* ======================================================== */}
      {/* TÍTULO OFICIAL E BREADCRUMB INTEGRADOS NO TOPO DO MAPA   */}
      {/* ======================================================== */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-30 flex flex-col items-start gap-2">
        {/* Marca NC Eleições + Título do Mapa */}
        <div className="flex items-center gap-2.5 sm:gap-3 bg-white/95 backdrop-blur-md px-3.5 sm:px-4 py-2 rounded-2xl shadow-xl border border-[#A8BED5]/60 select-none">
          <img
            src="/logo-nc-eleicoes.png"
            alt="NC Eleições"
            className="h-7 sm:h-8 w-auto object-contain select-none drop-shadow-xs"
          />
          <div className="h-6 w-[2px] bg-[#A8BED5]/70" />
          <h1 className="font-display font-black text-lg sm:text-xl text-[#152A57] tracking-tight uppercase">
            MAPA ELEITORAL
          </h1>
          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#152A57] text-white shadow-xs inline-flex items-center gap-1.5 ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            2º TURNO
          </span>
        </div>

        {/* Trilha de Navegação dos 3 Níveis */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#152A57]/90 text-white backdrop-blur-md shadow-xl border border-white/20 text-xs font-black font-display tracking-wider">
          <button
            onClick={handleGoToNational}
            className={`transition flex items-center gap-1.5 px-2 py-0.5 rounded-lg ${
              currentLevel === 'national' ? 'bg-[#1D4ED8] text-white shadow-xs' : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title="Ver o Brasil dividido em 5 Macrorregiões"
          >
            <span>🇧🇷 BRASIL</span>
          </button>

          {activeRegion && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <button
                onClick={() => handleGoToRegion(activeRegion)}
                className={`transition px-2 py-0.5 rounded-lg ${
                  currentLevel === 'regional' ? 'bg-[#1D4ED8] text-white shadow-xs' : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title={`Ver a Região ${activeRegion} dividida em seus Estados`}
              >
                <span>{activeRegion}</span>
              </button>
            </>
          )}

          {activeSelectedUf && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="bg-[#1D4ED8] text-white px-2 py-0.5 rounded-lg shadow-xs flex items-center gap-1">
                <MapPin className="w-3 h-3 text-cyan-300" />
                <span>{UFS_INFO[activeSelectedUf]?.nome} ({activeSelectedUf})</span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Indicador de nível e instrução ao vivo */}
      <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-30 hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-white/85 backdrop-blur-md text-[#152A57] border border-[#8FA7C4]/50 shadow-xs text-[11px] font-black uppercase tracking-wider">
        <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
        <span>
          {currentLevel === 'national' && '5 MACRORREGIÕES'}
          {currentLevel === 'regional' && `ESTADOS • ${activeRegion}`}
          {currentLevel === 'state' && `MUNICÍPIOS • ${UFS_INFO[activeSelectedUf || 'BR']?.nome?.toUpperCase()}`}
        </span>
      </div>

      {/* ======================================================== */}
      {/* LEGENDA OFICIAL DE CORES (LULA PT X FLÁVIO PL)            */}
      {/* ======================================================== */}
      <div className="absolute bottom-4 left-4 sm:bottom-5 sm:left-5 z-30 hidden sm:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-[#152A57]/90 text-white backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-wider shadow-lg">
        <span className="text-slate-300">Liderança:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#CC0000] shadow-sm" />
          <span>Lula (PT)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1A365D] border border-blue-400 shadow-sm" />
          <span>Flávio Bolsonaro (PL)</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-[#243B5A]" />
          <span>Sem Apuração</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* PALCO CENTRAL DO MAPA                                    */}
      {/* ======================================================== */}
      <div className="w-full h-full flex items-center justify-center relative pt-12 sm:pt-14 pb-2">
        
        {/* NÍVEL 3: RENDERIZAÇÃO DOS MUNICÍPIOS DO ESTADO SELECIONADO */}
        {currentLevel === 'state' ? (
          isLoadingMunicipalities ? (
            <div className="flex flex-col items-center justify-center gap-3 text-[#152A57]">
              <Loader2 className="w-10 h-10 animate-spin text-[#1D4ED8]" />
              <span className="font-display font-black text-sm uppercase tracking-wider">
                Carregando malha oficial de municípios de {UFS_INFO[activeSelectedUf || 'BR']?.nome}...
              </span>
            </div>
          ) : municipalityData ? (
            <div className="w-full h-full flex items-center justify-center relative">
              <svg
                viewBox={municipalityData.viewBox}
                className="w-full h-full max-h-[74vh] sm:max-h-[76vh] xl:max-h-[78vh] drop-shadow-2xl overflow-visible transition-all duration-300"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <filter id="munShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.3" floodColor="#000" />
                  </filter>
                  <filter id="munGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="0" stdDeviation="6" floodOpacity="0.8" floodColor="#00E5FF" />
                  </filter>
                </defs>

                {municipalityData.municipalities.map((mun) => {
                  const isHovered = hoveredMun?.id === mun.id;

                  // Cor de liderança do município:
                  // Se houver votos no município, usa cor do líder (PT #CC0000 ou PL #1A365D).
                  // Se o estado tiver líder consolidado com apuração, os municípios herdam a cor da liderança apurada.
                  const activeStateSummary = activeSelectedUf ? statesSummaryMap[activeSelectedUf] : null;
                  const stateHasVotes = activeStateSummary ? (activeStateSummary.pst > 0 && activeStateSummary.leader.vap > 0) : false;

                  let munBaseColor = '#243B5A';
                  let munHoverColor = '#00B4D8';

                  if (mun.leader === 'LULA' || (!mun.leader && stateHasVotes && (activeStateSummary?.leader.n === '13' || activeStateSummary?.leader.partido === 'PT'))) {
                    munBaseColor = '#CC0000';
                    munHoverColor = '#FF5252';
                  } else if (mun.leader === 'BOLSONARO' || (!mun.leader && stateHasVotes && (activeStateSummary?.leader.n === '22' || activeStateSummary?.leader.partido === 'PL'))) {
                    munBaseColor = '#1A365D';
                    munHoverColor = '#2563EB';
                  }

                  return (
                    <path
                      key={mun.id}
                      d={mun.d}
                      fill={isHovered ? munHoverColor : munBaseColor}
                      stroke={isHovered ? '#FFFFFF' : 'rgba(255, 255, 255, 0.45)'}
                      strokeWidth={isHovered ? 2.2 : 0.9}
                      strokeLinejoin="round"
                      filter={isHovered ? 'url(#munGlow)' : 'url(#munShadow)'}
                      className="cursor-pointer transition-colors duration-150"
                      onMouseEnter={() => setHoveredMun({ 
                        id: mun.id, 
                        nome: mun.nome,
                        leader: mun.leader || (stateHasVotes ? activeStateSummary?.leader.nm : undefined),
                        pvap: mun.pvap || (stateHasVotes ? activeStateSummary?.leader.pvap : undefined)
                      })}
                      onMouseLeave={() => setHoveredMun(null)}
                    />
                  );
                })}
              </svg>

              {/* Card flutuante do município sob o cursor no canto inferior direito */}
              {hoveredMun && (
                <div className="absolute bottom-4 right-4 sm:bottom-5 sm:right-5 bg-[#152A57]/95 text-white px-4 py-2.5 rounded-2xl backdrop-blur-md border border-cyan-400/80 shadow-2xl z-30 pointer-events-none flex flex-col items-start gap-1 animate-in fade-in zoom-in-95 duration-150 min-w-[220px] max-w-[280px]">
                  <div className="w-full flex items-center justify-between gap-2 border-b border-white/10 pb-1 mb-0.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-cyan-300 flex-shrink-0" />
                      <span className="font-display font-black text-xs uppercase tracking-wider text-white truncate">
                        {hoveredMun.nome}
                      </span>
                    </div>
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono flex-shrink-0">
                      {activeSelectedUf}
                    </span>
                  </div>
                  <div className="text-[11px] text-cyan-200 font-mono font-bold flex items-center gap-1.5">
                    {hoveredMun.leader ? (
                      <>
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor:
                              hoveredMun.leader === 'LULA' || hoveredMun.leader?.includes('LULA')
                                ? '#CC0000'
                                : '#1A365D',
                          }}
                        />
                        <span>{hoveredMun.leader}:</span>
                        <span className="text-white font-black">{formatPercentBR(hoveredMun.pvap || 0)}</span>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-300">0,00% APURADO • AGUARDANDO TSE</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-6 bg-white/80 rounded-2xl border border-slate-300">
              <p className="font-bold text-xs text-slate-700">Não foi possível carregar a malha dos municípios.</p>
              <button
                onClick={handleGoToNational}
                className="mt-3 px-4 py-1.5 rounded-xl bg-[#152A57] text-white font-bold text-xs"
              >
                Voltar ao Brasil Geral
              </button>
            </div>
          )
        ) : (
          /* ======================================================== */
          /* NÍVEL 1 (BRASIL POR REGIÕES) E NÍVEL 2 (REGIÃO POR ESTADOS) */
          /* ======================================================== */
          <svg
            viewBox={currentViewBox}
            className="w-full h-full max-h-[74vh] sm:max-h-[76vh] xl:max-h-[78vh] drop-shadow-2xl overflow-visible transition-all duration-500 ease-in-out"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <filter id="geoStateShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="8" stdDeviation="6" floodOpacity="0.4" floodColor="#000" />
              </filter>
              <filter id="geoStateGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="0" stdDeviation="10" floodOpacity="0.8" floodColor="#00E5FF" />
              </filter>
            </defs>

            {/* Renderização dos estados */}
            {stateKeys.map((uf) => {
              const geo = BRAZIL_GEO_STATES[uf];
              if (!geo) return null;

              // NÍVEL 2: Oculta estados de outras regiões se uma região estiver selecionada
              if (currentLevel === 'regional' && activeRegion && geo.region !== activeRegion) {
                return null;
              }

              const stateSummary = statesSummaryMap[uf];
              const hasVotes = stateSummary ? stateSummary.pst > 0 && stateSummary.leader.vap > 0 : false;

              // Identifica a cor do candidato líder no estado:
              // Lula (PT • 13) -> #CC0000 | Flávio Bolsonaro (PL • 22) -> #1A365D
              let stateLeaderBaseColor = '#243B5A';
              let stateLeaderHoverColor = '#32527B';

              if (hasVotes && stateSummary?.leader) {
                if (stateSummary.leader.n === '13' || stateSummary.leader.partido === 'PT') {
                  stateLeaderBaseColor = '#CC0000';
                  stateLeaderHoverColor = '#E53935';
                } else if (stateSummary.leader.n === '22' || stateSummary.leader.partido === 'PL') {
                  stateLeaderBaseColor = '#1A365D';
                  stateLeaderHoverColor = '#2563EB';
                } else {
                  stateLeaderBaseColor = stateSummary.leader.cor || '#1E3A8A';
                  stateLeaderHoverColor = '#00B4D8';
                }
              }

              const isUfSelected = selectedUf === uf;
              const isUfHovered = effectiveHoveredUf === uf;
              const isRegHovered = effectiveHoveredRegion === geo.region;
              const isRegSelected = activeRegion === geo.region;
              const regionData = regionLeaders[geo.region];

              let fillColor = stateLeaderBaseColor;

              if (currentLevel === 'national') {
                // Nível 1: A cor da região reflete o candidato que está ganhando no consolidado da região!
                if (isRegHovered) {
                  fillColor = regionData.hoverColor;
                } else {
                  fillColor = regionData.color;
                }
              } else {
                // Nível 2: A cor do estado reflete quem está ganhando naquele estado específico!
                if (isUfSelected) {
                  fillColor = '#00E5FF';
                } else if (isUfHovered) {
                  fillColor = stateLeaderHoverColor;
                } else if (isRegSelected || isRegHovered) {
                  fillColor = stateLeaderBaseColor;
                }
              }

              const strokeColor = currentLevel === 'national'
                ? (isRegHovered ? '#FFFFFF' : 'rgba(255, 255, 255, 0.35)')
                : (isUfSelected ? '#FFFFFF' : isUfHovered ? '#FFFFFF' : 'rgba(255, 255, 255, 0.75)');

              const strokeWidth = currentLevel === 'national'
                ? (isRegHovered ? 2.5 : 1.0)
                : (isUfSelected ? 2.8 : isUfHovered ? 2.2 : 1.2);

              const fontSize = currentLevel === 'regional'
                ? Math.max(9, Math.round((FONT_SIZES[uf] || 13) * 0.85))
                : (FONT_SIZES[uf] || 13);

              return (
                <g
                  key={uf}
                  id={`geo-state-${uf}`}
                  className="cursor-pointer transition-all duration-200"
                  onClick={() => handleMapElementClick(uf, geo.region)}
                  onMouseEnter={() => {
                    setInternalHoveredUf(uf);
                    setInternalHoveredRegion(geo.region);
                    onHoverUf?.(uf);
                    prefetchLiveTseData(uf, currentCargo);
                  }}
                  onMouseLeave={() => {
                    setInternalHoveredUf(null);
                    setInternalHoveredRegion(null);
                    onHoverUf?.(null);
                  }}
                  style={{
                    transformOrigin: `${geo.labelX}px ${geo.labelY}px`,
                  }}
                >
                  <path
                    d={geo.d}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    filter={isUfSelected || isUfHovered || (currentLevel === 'national' && isRegHovered) ? 'url(#geoStateGlow)' : 'url(#geoStateShadow)'}
                    className="transition-colors duration-200 ease-out"
                  />

                  {/* Mostra siglas dos estados apenas no Nível 2 (quando a região está aberta) */}
                  {currentLevel === 'regional' && (
                    <>
                      {uf === 'DF' && (
                        <circle
                          cx={geo.labelX}
                          cy={geo.labelY}
                          r="8"
                          fill="#00E5FF"
                          stroke="#FFFFFF"
                          strokeWidth="2"
                          className="animate-pulse"
                        />
                      )}
                      <text
                        x={geo.labelX}
                        y={geo.labelY}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#FFFFFF"
                        fontSize={fontSize}
                        fontWeight="900"
                        fontFamily="'Montserrat', 'Inter', sans-serif"
                        letterSpacing="0.05em"
                        pointerEvents="none"
                        className="transition-transform duration-200"
                        style={{
                          textShadow: '0 2px 4px rgba(0,0,0,0.85), 0 1px 2px rgba(0,0,0,0.9)',
                        }}
                      >
                        {uf}
                      </text>
                    </>
                  )}
                </g>
              );
            })}

            {/* NÍVEL 1: RÓTULOS E BADGES DAS 5 MACRORREGIÕES NO MAPA COMPLETO */}
            {currentLevel === 'national' && (
              <g className="pointer-events-none">
                {(Object.keys(REGION_CENTERS) as Region[]).map((reg) => {
                  const center = REGION_CENTERS[reg];
                  const isHovered = effectiveHoveredRegion === reg;
                  const ufsOfRegion = REGIONS_DATA[reg];
                  const regData = regionLeaders[reg];

                  // Cor do badge da região: adota a cor do líder (PT #CC0000, PL #1A365D ou #152A57)
                  const badgeFill = isHovered 
                    ? '#00E5FF' 
                    : regData.leader === 'LULA' 
                    ? '#B71C1C' 
                    : regData.leader === 'BOLSONARO' 
                    ? '#1A365D' 
                    : '#152A57';

                  const badgeTextSub = regData.leader === 'LULA' 
                    ? 'LULA LIDERANDO' 
                    : regData.leader === 'BOLSONARO' 
                    ? 'FLÁVIO LIDERANDO' 
                    : `${ufsOfRegion.length} ESTADOS`;

                  return (
                    <g
                      key={`region-badge-${reg}`}
                      className="transition-transform duration-200"
                      style={{
                        transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                        transformOrigin: `${center.x}px ${center.y}px`,
                      }}
                    >
                      {/* Fundo do Badge da Região */}
                      <rect
                        x={center.x - 75}
                        y={center.y - 21}
                        width="150"
                        height="42"
                        rx="12"
                        fill={badgeFill}
                        stroke="#FFFFFF"
                        strokeWidth="2.5"
                        filter="url(#geoStateShadow)"
                      />
                      <text
                        x={center.x}
                        y={center.y - 4}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={isHovered ? '#152A57' : '#FFFFFF'}
                        fontSize="13"
                        fontWeight="900"
                        fontFamily="'Montserrat', 'Inter', sans-serif"
                        letterSpacing="0.08em"
                      >
                        {center.label}
                      </text>
                      <text
                        x={center.x}
                        y={center.y + 11}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={isHovered ? '#0A2540' : '#E2E8F0'}
                        fontSize="8.5"
                        fontWeight="800"
                        fontFamily="'Montserrat', 'Inter', sans-serif"
                        letterSpacing="0.04em"
                      >
                        {badgeTextSub}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}
          </svg>
        )}

        {/* Card Flutuante de dados oficiais ao passar mouse em estado (Nível 2) */}
        {currentLevel === 'regional' && activeGeo && activeInfo && (
          <div className="absolute top-4 right-4 sm:top-5 sm:right-5 bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl border border-white/20 shadow-2xl pointer-events-none z-30 min-w-[220px] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                {activeGeo.region} • {activeInfo.capital}
              </span>
              <span className="bg-[#1D4ED8] text-white px-2 py-0.5 rounded-md text-xs font-black shadow-xs font-mono">
                {activeGeo.uf}
              </span>
            </div>

            <div className="text-base sm:text-lg font-black tracking-tight text-white uppercase font-display mb-1.5">
              {activeInfo.nome}
            </div>

            {activeStateSummary?.leader && (
              <div className="space-y-1.5 pt-1.5 border-t border-white/20 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold truncate max-w-[140px]">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ 
                        backgroundColor: activeStateSummary.leader.n === '13' || activeStateSummary.leader.partido === 'PT' 
                          ? '#CC0000' 
                          : activeStateSummary.leader.n === '22' || activeStateSummary.leader.partido === 'PL' 
                          ? '#1A365D' 
                          : (activeStateSummary.leader.cor || '#1E3A8A') 
                      }}
                    />
                    {activeStateSummary.leader.nm}
                  </span>
                  <span className="font-mono font-black text-amber-300">
                    {formatPercentBR(activeStateSummary.leader.pvap)}
                  </span>
                </div>
              </div>
            )}
            <div className="mt-2 text-[10px] text-cyan-300 font-bold uppercase tracking-wider text-center pt-1 border-t border-white/10">
              Clique para ver os municípios
            </div>
          </div>
        )}

      </div>
    </div>
  );
});
