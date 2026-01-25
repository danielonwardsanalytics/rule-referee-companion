import { cn } from "@/lib/utils";

export type CompanionMode = 'hub' | 'quickStart' | 'tournament' | 'guided';

interface ModeSelectorProps {
  activeMode: CompanionMode;
  onModeChange: (mode: CompanionMode) => void;
  /** When provided, called instead of onModeChange to allow for confirmation */
  onModeChangeRequest?: (mode: CompanionMode) => void;
}

export const modeLabels: Record<CompanionMode, string> = {
  hub: 'Hub',
  quickStart: 'Quick Start',
  tournament: 'Tournament',
  guided: 'Guided',
};

const modes: { id: CompanionMode; label: string }[] = [
  { id: 'hub', label: 'Hub' },
  { id: 'quickStart', label: 'Quick Start' },
  { id: 'tournament', label: 'Tournament' },
  { id: 'guided', label: 'Guided' },
];

export function ModeSelector({ activeMode, onModeChange, onModeChangeRequest }: ModeSelectorProps) {
  const handleClick = (mode: CompanionMode) => {
    if (mode === activeMode) return; // Already on this mode
    
    if (onModeChangeRequest) {
      onModeChangeRequest(mode);
    } else {
      onModeChange(mode);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {modes.map((mode) => {
        const isActive = activeMode === mode.id;
        return (
          <button
            key={mode.id}
            onClick={() => handleClick(mode.id)}
            className={cn(
              "min-h-[56px] px-5 py-4 rounded-2xl text-base font-medium transition-all text-center",
              "focus:outline-none focus:ring-2 focus:ring-primary/50",
              "bg-slate-800/80 border border-slate-700/50 text-white",
              isActive
                ? "ring-2 ring-primary/50 border-primary/50"
                : "hover:bg-slate-700/80"
            )}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}
