import { cn } from "@/lib/utils";
import { Compass, Zap, Trophy, BookOpen } from "lucide-react";

export type CompanionMode = 'hub' | 'quickStart' | 'tournament' | 'guided';

interface ModeSelectorProps {
  activeMode: CompanionMode;
  onModeChange: (mode: CompanionMode) => void;
}

const modes: { id: CompanionMode; label: string; icon: React.ElementType; iconColor: string }[] = [
  { id: 'hub', label: 'Hub', icon: Compass, iconColor: 'text-orange-500' },
  { id: 'quickStart', label: 'Quick Start', icon: Zap, iconColor: 'text-emerald-400' },
  { id: 'tournament', label: 'Tournament', icon: Trophy, iconColor: 'text-purple-400' },
  { id: 'guided', label: 'Guided', icon: BookOpen, iconColor: 'text-sky-400' },
];

export function ModeSelector({ activeMode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {modes.map((mode) => {
        const isActive = activeMode === mode.id;
        const Icon = mode.icon;
        return (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={cn(
              "flex items-center justify-center gap-3 min-h-[56px] px-5 py-4 rounded-2xl text-base font-medium transition-all",
              "focus:outline-none focus:ring-2 focus:ring-primary/50",
              "bg-slate-800/80 border border-slate-700/50",
              isActive
                ? "ring-2 ring-primary/50 border-primary/50"
                : "hover:bg-slate-700/80"
            )}
          >
            <Icon className={cn("w-5 h-5", mode.iconColor)} />
            <span className="text-white">{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}
