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
              "min-h-[48px] px-4 py-3 rounded-lg border text-sm font-medium transition-all",
              "focus:outline-none focus:ring-2 focus:ring-primary/50",
              isActive
                ? "bg-primary/10 border-primary text-white shadow-[0_0_12px_hsl(var(--primary)/0.3)]"
                : "bg-card border-border text-white hover:border-primary/50"
            )}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}
