import { useState, useEffect, useCallback } from 'react';
import type { Cargo, ElectionDataPackage, Region, RegionSummary, UF } from './types/election';
import { 
  fetchLiveTseData, 
  fetchLiveRegionData,
  fetchLiveMacroRegions,
  getCachedRegionData,
  getCachedNationalData,
} from './services/tseService';
import { getElectionSnapshotFromDb } from './services/imageDbService';
import { getOfficialTsePackage } from './data/officialTsePresidentialData';
import { CandidateList } from './components/CandidateList';
import { PresidentialDuelStage } from './components/PresidentialDuelStage';
import { MacroAnalyticsModal } from './components/MacroAnalyticsModal';
import { StudioBroadcastOverlay } from './components/StudioBroadcastOverlay';
import { REGIONS_DATA } from './data/regionsAndUfs';

export function App() {
  // Navigation & Screen Modes (Fixo no Palco do Duelo com Mapa do Brasil e Apuração)
  const [screenMode] = useState<'brazil_map' | 'regional_detail'>('brazil_map');
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [isRegionTotal, setIsRegionTotal] = useState<boolean>(false);

  // Electoral Filters (Fixo e exclusivo em Presidente da República)
  const [currentCargo, setCurrentCargo] = useState<Cargo>('PRESIDENTE');
  const [currentUf, setCurrentUf] = useState<UF>('BR');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Modals & Overlays
  const [isMacroOpen, setIsMacroOpen] = useState<boolean>(false);
  const [isStudioFullscreen, setIsStudioFullscreen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live election data package diretamente com dados oficiais consolidados do TSE
  const [electionData, setElectionData] = useState<ElectionDataPackage>(() => {
    const pkg = getOfficialTsePackage('BR');
    return {
      cargo: 'PRESIDENTE',
      uf: 'BR',
      stats: pkg.stats,
      candidates: pkg.candidates,
      isLive: true,
      dataSource: 'TSE_API'
    };
  });

  const [macroRegionsData, setMacroRegionsData] = useState<RegionSummary[]>([]);
  const [sharedHoveredUf, setSharedHoveredUf] = useState<UF | null>(null);


  // Carrega dados oficiais diretamente da CDN do TSE com SWR instantâneo para UF/Cargo
  const loadOfficialTseData = useCallback(async (uf: UF, cargo: Cargo, showToast = false) => {
    if (showToast) {
      setIsLoading(true);
      setToastMessage('Conectando à CDN Oficial do TSE...');
    }

    try {
      // Callback SWR: se houver snapshot em memória ou no IndexedDB, exibe imediatamente (0ms)
      const onStaleSnapshot = (staleData: ElectionDataPackage) => {
        setElectionData(staleData);
        if (showToast) setIsLoading(false);
      };

      const result = await fetchLiveTseData(uf, cargo, onStaleSnapshot);
      if (result.success && result.data && result.data.candidates.length > 0) {
        setElectionData(result.data);
        if (showToast) {
          setToastMessage(`✅ Dados oficiais do TSE sincronizados às ${result.data.stats.horaAtualizacao}!`);
          setTimeout(() => setToastMessage(null), 3500);
        }
      }
    } catch {
      // Ignora erro de rede temporário
    } finally {
      if (showToast) {
        setIsLoading(false);
      }
    }
  }, []);

  // Carrega dados consolidados da região inteira somando todos os seus estados
  const loadOfficialRegionData = useCallback(async (region: Region, showToast = false) => {
    if (showToast) {
      setIsLoading(true);
      setToastMessage(`Consolidando dados da Região ${region} via TSE...`);
    }

    try {
      const result = await fetchLiveRegionData(region);
      if (result.success && result.data && result.data.candidates.length > 0) {
        setElectionData(result.data);
        if (showToast) {
          setToastMessage(`✅ Total consolidado da Região ${region} sincronizado!`);
          setTimeout(() => setToastMessage(null), 3500);
        }
      } else {
        if (showToast) {
          setToastMessage('⚠️ Falha ao consolidar dados da região. Tentando novamente...');
          setTimeout(() => setToastMessage(null), 3500);
        }
      }
    } catch {
      // Ignora erro de rede temporário
    } finally {
      if (showToast) {
        setIsLoading(false);
      }
    }
  }, []);

  // Carrega imediatamente o último snapshot salvo no IndexedDB (0ms) garantindo que a tela nunca abra vazia
  useEffect(() => {
    getElectionSnapshotFromDb('PRESIDENTE-BR').then((saved) => {
      if (saved && saved.candidates && saved.candidates.length > 0) {
        setElectionData(saved);
      }
    }).catch(() => {});
  }, []);

  // Calibra em segundo plano o status oficial nacional de Presidente (para garantir regras de 2º turno em estados/regiões)
  useEffect(() => {
    fetchLiveTseData('BR', 'PRESIDENTE').catch(() => {});
  }, []);

  // Efeito para carregar dados ao mudar UF, Região ou Cargo + Polling automático a cada 5 segundos (5000ms)
  useEffect(() => {
    if (isRegionTotal && selectedRegion) {
      loadOfficialRegionData(selectedRegion);

      const pollInterval = setInterval(() => {
        loadOfficialRegionData(selectedRegion, false);
      }, 5000);

      return () => clearInterval(pollInterval);
    } else {
      loadOfficialTseData(currentUf, currentCargo);

      const pollInterval = setInterval(() => {
        loadOfficialTseData(currentUf, currentCargo, false);
      }, 5000);

      return () => clearInterval(pollInterval);
    }
  }, [isRegionTotal, selectedRegion, currentUf, currentCargo, loadOfficialRegionData, loadOfficialTseData]);

  // Carrega consolidação das macrorregiões ao abrir modal macro
  useEffect(() => {
    if (isMacroOpen) {
      fetchLiveMacroRegions().then((data) => setMacroRegionsData(data));
    }
  }, [isMacroOpen]);


  // Seleção de Região (ativa consolidação da soma dos estados daquela região de forma imediata e atômica)
  const handleSelectRegion = (region: Region | null) => {
    setSelectedRegion(region);
    if (region) {
      setIsRegionTotal(true);
      setCurrentUf('BR');
      const immediate = getCachedRegionData(region);
      if (immediate) {
        setElectionData(immediate);
      }
    } else {
      setIsRegionTotal(false);
      setCurrentUf('BR');
      const national = getCachedNationalData();
      if (national) {
        setElectionData(national);
      }
    }
  };

  // Seleção direta de UF (clique em qualquer estado específico ou Nacional)
  const handleSelectUf = (uf: UF) => {
    if (uf === 'BR') {
      setCurrentUf('BR');
      setCurrentCargo('PRESIDENTE');
      setSelectedRegion(null);
      setIsRegionTotal(false);
    } else {
      setIsRegionTotal(false);
      setCurrentUf(uf);
      // Identifica e ativa a região pertencente
      for (const [reg, ufs] of Object.entries(REGIONS_DATA)) {
        if (ufs.includes(uf)) {
          setSelectedRegion(reg as Region);
          break;
        }
      }
    }
  };

  // Sincronização manual acionada pelo apresentador
  const handleRefreshTse = () => {
    if (isRegionTotal && selectedRegion) {
      loadOfficialRegionData(selectedRegion, true);
    } else {
      loadOfficialTseData(currentUf, currentCargo, true);
    }
  };

  return (
    <div 
      className="h-screen w-screen overflow-hidden text-[#152A57] flex flex-col font-sans selection:bg-[#152A57] selection:text-white relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/studio-bg.jpg')" }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-[#152A57] text-white font-bold text-xs shadow-2xl border border-blue-400 max-w-lg text-center animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Palco Principal Integrado de Broadcast com Safe Area Ampla de TV (Sem navbar fixa no topo) */}
      <main className="w-full h-full px-6 sm:px-12 lg:px-16 xl:px-24 2xl:px-28 py-6 sm:py-8 lg:py-10 flex-1 min-h-0 flex flex-col lg:flex-row gap-4 xl:gap-6 items-stretch overflow-hidden">
        
        {/* Central Display Area: Palco Principal do Mapa e Apuração */}
        <section className="flex-1 min-w-0 h-full overflow-hidden flex flex-col order-1">
          {screenMode === 'brazil_map' ? (
            <PresidentialDuelStage
              currentUf={currentUf}
              selectedRegion={selectedRegion}
              onSelectRegion={handleSelectRegion}
              hoveredUf={sharedHoveredUf}
              onHoverUf={setSharedHoveredUf}
              onSelectUf={handleSelectUf}
              candidates={electionData.candidates}
              stats={electionData.stats}
              isLoading={isLoading}
              onRefreshTse={handleRefreshTse}
            />
          ) : (
            /* ======================================================== */
            /* APURAÇÃO OFICIAL: PALCO PRINCIPAL DE CANDIDATOS           */
            /* ======================================================== */
            <div className="w-full h-full min-h-0 flex flex-col animate-fadeIn overflow-hidden">
              <CandidateList
                candidates={electionData.candidates}
                cargo={currentCargo}
                uf={currentUf}
                totalValidos={electionData.stats.votosValidos}
              />
            </div>
          )}
        </section>
      </main>

      {/* Macro Analytics Modal */}
      <MacroAnalyticsModal
        isOpen={isMacroOpen}
        onClose={() => setIsMacroOpen(false)}
        stats={electionData.stats}
        regionsData={macroRegionsData}
        onSelectRegionUf={handleSelectUf}
      />

      {/* Studio 16:9 / 4K Fullscreen Broadcast Overlay */}
      <StudioBroadcastOverlay
        isOpen={isStudioFullscreen}
        onClose={() => setIsStudioFullscreen(false)}
        cargo={currentCargo}
        uf={currentUf}
        candidates={electionData.candidates}
        stats={electionData.stats}
        isSimulating={false}
        onTogglePlay={handleRefreshTse}
      />
    </div>
  );
}

export default App;
