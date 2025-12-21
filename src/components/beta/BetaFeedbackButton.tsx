import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
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
            "w-10 h-10 rounded-full",
            "bg-primary text-primary-foreground",
            "flex items-center justify-center",
            "shadow-lg hover:shadow-xl",
            "transition-all duration-200",
            "hover:scale-105 active:scale-95",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          )}
          aria-label="Send feedback"
        >
          <MessageSquarePlus className="w-5 h-5" />
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
