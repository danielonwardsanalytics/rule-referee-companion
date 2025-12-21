import { useState } from "react";
import { Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BetaFeedbackPopover } from "./BetaFeedbackPopover";
import { cn } from "@/lib/utils";

export const BetaFeedbackButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "fixed bottom-20 right-4 z-40",
            "h-8 px-3 rounded-full",
            "bg-primary text-primary-foreground",
            "flex items-center gap-1.5",
            "shadow-lg hover:shadow-xl",
            "transition-all duration-200",
            "hover:scale-105 active:scale-95",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            "text-xs font-medium"
          )}
          aria-label="Send feedback"
        >
          <Plus className="w-3.5 h-3.5" />
          Feedback
        </button>
      </PopoverTrigger>
      <PopoverContent 
        side="top" 
        align="end" 
        className="w-80 p-0 border-border/50 shadow-xl"
        sideOffset={8}
      >
        <BetaFeedbackPopover onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
};
