import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Sparkles, 
  Activity, 
  X
} from 'lucide-react';
import { formatPercentBR } from '../services/tseService';

interface SimulatorControlsProps {
  isOpen: boolean;
  onClose: () => void;
  progress: number;
  onProgressChange: (newProgress: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  onReset: () => void;
  scenario: 'COMPETITIVO' | 'VITORIA_DIRETA';
  onScenarioChange: (scenario: 'COMPETITIVO' | 'VITORIA_DIRETA') => void;
  onTriggerConfetti: () => void;
}

export const SimulatorControls: React.FC<SimulatorControlsProps> = ({
  isOpen,
  onClose,
  progress,
  onProgressChange,
  isPlaying,
  onTogglePlay,
  speed,
  onSpeedChange,
  onReset,
  scenario,
  onScenarioChange,
  onTriggerConfetti,
}) => {
  if (!isOpen) return null;

  const speeds = [1, 2, 5, 10];

  return (
    <div className="bg-slate-900 text-white border-b border-slate-700/80 shadow-2xl px-4 py-3 sm:px-6 transition-all duration-300 relative z-30">
      <div className="max-w-7xl mx-auto flex flex-col gap-3">
        {/* Top Header of Simulator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Activity className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h4 className="font-display font-black text-sm tracking-wide flex items-center gap-2">
                PAINEL DE TRANSMISSÃO AO VIVO (SIMULADOR DO TSE)
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {isPlaying ? 'Transmitindo Contagem' : 'Pausado'}
                </span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Ajuste o percentual de apuração gradativa de 0% a 100% e observe as viradas dinâmicas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onTriggerConfetti}
              title="Testar comemoração de eleição"
              className="px-2.5 py-1 text-xs rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 font-bold flex items-center gap-1 border border-amber-400/30 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chuva da Vitória</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Controls Row: Slider, Buttons, Speeds */}
        <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
          {/* Play/Pause & Reset Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onTogglePlay}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-display font-black text-xs tracking-wider transition ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isPlaying ? 'PAUSAR' : 'AVANÇAR AO VIVO'}</span>
            </button>

            <button
              onClick={onReset}
              title="Reiniciar Apuração em 0%"
              className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Range Slider (0% - 100%) */}
          <div className="flex-1 w-full flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-slate-400">0%</span>
            <div className="flex-1 relative flex items-center">
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={progress}
                onChange={(e) => onProgressChange(parseFloat(e.target.value))}
                className="w-full h-2.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
              />
            </div>
            <div className="min-w-[70px] text-right font-display font-black text-lg text-amber-400">
              {formatPercentBR(progress, 1)}
            </div>
          </div>

          {/* Speed Multiplier Pill Buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
              <FastForward className="w-3.5 h-3.5" />
              VEL:
            </span>
            {speeds.map((s) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition ${
                  speed === s
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Scenarios and Quick Checkpoints */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Cenário Dramático:</span>
            <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
              <button
                onClick={() => onScenarioChange('COMPETITIVO')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                  scenario === 'COMPETITIVO'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Virada Histórica (Crossover aos ~70%)
              </button>
              <button
                onClick={() => onScenarioChange('VITORIA_DIRETA')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                  scenario === 'VITORIA_DIRETA'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Vitória Consolidada
              </button>
            </div>
          </div>

          {/* Quick jumps */}
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-slate-400">Marcos:</span>
            {[
              { label: 'Início (10%)', val: 10 },
              { label: 'Disputa (50%)', val: 50 },
              { label: 'Virada (72%)', val: 72 },
              { label: 'Matemático (94%)', val: 94 },
              { label: '100% Final', val: 100 },
            ].map((m) => (
              <button
                key={m.val}
                onClick={() => onProgressChange(m.val)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700 transition"
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
