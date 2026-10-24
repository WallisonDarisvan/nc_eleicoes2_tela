import React from 'react';
import { 
  Award, 
  Crown, 
  Building2, 
  Users, 
  UserCheck 
} from 'lucide-react';
import type { Cargo } from '../types/election';

interface CargoNavProps {
  currentCargo: Cargo;
  onSelectCargo: (cargo: Cargo) => void;
}

const CARGO_CONFIG: Array<{
  id: Cargo;
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'PRESIDENTE', label: 'PRESIDENTE', sub: 'República', icon: Crown },
  { id: 'GOVERNADOR', label: 'GOVERNADOR', sub: 'Estado', icon: Building2 },
  { id: 'SENADOR', label: 'SENADOR', sub: 'Senado Federal', icon: Award },
  { id: 'DEP_FEDERAL', label: 'DEP. FEDERAL', sub: 'Câmara dos Deputados', icon: Users },
  { id: 'DEP_ESTADUAL', label: 'DEP. ESTADUAL', sub: 'Assembleia Legislativa', icon: UserCheck },
];

export const CargoNav: React.FC<CargoNavProps> = ({ currentCargo, onSelectCargo }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-studio-border/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] py-2.5 px-4 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between sm:justify-center gap-1.5 sm:gap-3 overflow-x-auto no-scrollbar">
        {CARGO_CONFIG.map((item) => {
          const isSelected = currentCargo === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSelectCargo(item.id)}
              className={`relative flex items-center gap-2 px-3 sm:px-5 py-2 rounded-xl font-display font-extrabold text-xs sm:text-sm tracking-wide transition-all flex-shrink-0 whitespace-nowrap ${
                isSelected
                  ? 'bg-studio-navy text-white shadow-studio-elevated scale-105'
                  : 'bg-studio-slate hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
              <span>{item.label}</span>
              {isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse ml-0.5"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
