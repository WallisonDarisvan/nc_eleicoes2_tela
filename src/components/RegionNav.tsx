import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  MapPin, 
  Search, 
  Check 
} from 'lucide-react';
import type { Region, UF } from '../types/election';
import { REGIONS_DATA, UFS_INFO } from '../data/regionsAndUfs';

interface RegionNavProps {
  currentUf: UF;
  onSelectUf: (uf: UF) => void;
}

export const RegionNav: React.FC<RegionNavProps> = ({ currentUf, onSelectUf }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRegions, setExpandedRegions] = useState<Record<Region, boolean>>({
    'NORTE': false,
    'NORDESTE': false,
    'CENTRO-OESTE': false,
    'SUDESTE': true, // Default open Sudeste
    'SUL': false,
  });

  const toggleRegion = (region: Region) => {
    setExpandedRegions(prev => ({
      ...prev,
      [region]: !prev[region]
    }));
  };

  // Filter UFs when searching
  const isSearching = searchTerm.trim().length > 0;
  const filteredUfs = Object.values(UFS_INFO).filter(
    item =>
      item.sigla.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className="w-full lg:w-72 bg-white rounded-2xl border border-studio-border/90 shadow-studio-card flex flex-col p-4 flex-shrink-0 h-fit lg:sticky lg:top-36">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-studio-navy" />
          <h3 className="font-display font-black text-sm uppercase tracking-wider text-studio-navyDark">
            Filtro Geográfico
          </h3>
        </div>
        <span className="text-[11px] font-bold text-slate-400">27 UFs + BR</span>
      </div>

      {/* Quick Country Selector: BRASIL */}
      <div className="mt-3">
        <button
          onClick={() => onSelectUf('BR')}
          className={`w-full flex items-center justify-between p-3 rounded-xl font-bold transition-all ${
            currentUf === 'BR'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md'
              : 'bg-studio-slate hover:bg-slate-200 text-slate-800 border border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🇧🇷</span>
            <div className="text-left">
              <div className="text-sm font-black tracking-wide">BRASIL (CONSOLIDADO)</div>
              <div className={`text-[10px] ${currentUf === 'BR' ? 'text-emerald-100' : 'text-slate-500'}`}>
                156,4 milhões de eleitores
              </div>
            </div>
          </div>
          {currentUf === 'BR' && <Check className="w-4 h-4" />}
        </button>
      </div>

      {/* Search Input */}
      <div className="mt-3 relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar estado (ex: SP, Bahia)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-studio-accent/30 focus:border-studio-accent font-medium transition"
        />
        {isSearching && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
          >
            ×
          </button>
        )}
      </div>

      {/* Regions List / Accordion */}
      <div className="mt-3 max-h-[480px] overflow-y-auto space-y-1.5 pr-1">
        {isSearching ? (
          // Search Results
          <div className="space-y-1">
            <div className="text-[11px] font-bold text-slate-400 px-1 py-1">
              Resultados da Busca ({filteredUfs.length})
            </div>
            {filteredUfs.map((ufItem) => (
              <button
                key={ufItem.sigla}
                onClick={() => onSelectUf(ufItem.sigla)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  currentUf === ufItem.sigla
                    ? 'bg-studio-navy text-white shadow-sm'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span>{ufItem.nome} ({ufItem.sigla})</span>
                <span className="font-mono text-[10px] opacity-70">{ufItem.regiao}</span>
              </button>
            ))}
          </div>
        ) : (
          // Regional Accordions
          (Object.keys(REGIONS_DATA) as Region[]).map((region) => {
            const ufs = REGIONS_DATA[region];
            const isExpanded = expandedRegions[region];
            const hasSelected = ufs.includes(currentUf);

            return (
              <div key={region} className="border border-slate-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleRegion(region)}
                  className={`w-full flex items-center justify-between p-2.5 text-xs font-black tracking-wider transition ${
                    hasSelected
                      ? 'bg-slate-100 text-studio-navyDark font-black'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-studio-accent"></span>
                    <span>{region}</span>
                    <span className="text-[10px] font-mono text-slate-400 font-normal">
                      ({ufs.length})
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </button>

                {isExpanded && (
                  <div className="p-1.5 bg-slate-50/50 grid grid-cols-2 gap-1 border-t border-slate-100">
                    {ufs.map((uf) => {
                      const isSelected = currentUf === uf;
                      const ufData = UFS_INFO[uf];

                      return (
                        <button
                          key={uf}
                          onClick={() => onSelectUf(uf)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                            isSelected
                              ? 'bg-studio-navy text-white shadow-sm'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/60'
                          }`}
                          title={`${ufData.nome} - Capital: ${ufData.capital}`}
                        >
                          <span className="font-mono tracking-wide">{uf}</span>
                          <span className={`text-[10px] font-normal truncate max-w-[65px] ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
                            {ufData.nome}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
