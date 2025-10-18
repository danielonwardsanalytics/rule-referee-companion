import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceHeroButtonProps {
  state: "idle" | "listening" | "thinking" | "speaking";
  onClick: () => void;
}

const VoiceHeroButton = ({ state, onClick }: VoiceHeroButtonProps) => {
  return (
    <button
      onClick={onClick}
      role="button"
      aria-live="polite"
      aria-label={
        state === "idle"
          ? "Start voice session"
          : state === "listening"
          ? "Listening"
          : state === "thinking"
          ? "Processing"
          : "Speaking"
      }
      className={cn(
        "relative flex flex-col items-center justify-center",
        "w-60 h-60 rounded-full",
        "bg-gradient-to-br from-primary to-primary/80",
        "text-white font-semibold",
        "transition-all duration-300",
        "hover:scale-105 focus:outline-none focus:ring-4 focus:ring-accent",
        "shadow-[var(--shadow-soft)]",
        state === "listening" && "animate-pulse ring-4 ring-accent",
        state === "thinking" && "animate-pulse"
      )}
    >
      <Mic className={cn("w-16 h-16 mb-3", state !== "idle" && "animate-bounce")} />
      <div className="text-center px-6">
        <div className="text-lg font-semibold">Tell me what game you're playing</div>
        <div className="text-sm opacity-90 mt-1">and ask a question</div>
      </div>
      {state === "listening" && (
        <div className="absolute inset-0 rounded-full border-4 border-accent animate-ping" />
      )}
    </button>
  );
};

export default VoiceHeroButton;
