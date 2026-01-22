import { cn } from "@/lib/utils";

export type CompanionMode = 'hub' | 'quickStart' | 'tournament' | 'guided';

interface ModeSelectorProps {
  activeMode: CompanionMode;
  onModeChange: (mode: CompanionMode) => void;
}

const modes: { id: CompanionMode; label: string }[] = [
  { id: 'hub', label: 'Hub' },
  { id: 'quickStart', label: 'Quick Start' },
  { id: 'tournament', label: 'Tournament' },
  { id: 'guided', label: 'Guided' },
];

export function ModeSelector({ activeMode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {modes.map((mode) => {
        const isActive = activeMode === mode.id;
        return (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
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
