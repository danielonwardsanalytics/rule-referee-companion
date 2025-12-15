import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface ContextItem {
  id: string;
  name: string;
  gameName: string;
  gameId: string;
}

interface ContextSelectorBoxProps {
  label: string;
  type: "ruleSet" | "tournament";
  activeItem: ContextItem | null | undefined;
  availableItems: ContextItem[];
  onSelect: (id: string) => void;
  onClear: () => void;
}

export const ContextSelectorBox = ({
  label,
  type,
  activeItem,
  availableItems,
  onSelect,
  onClear,
}: ContextSelectorBoxProps) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = !!activeItem;
  const displayText = isActive ? activeItem.name : `No ${type === "ruleSet" ? "rules" : "tournament"} active`;

  const handleChangeNavigation = () => {
    if (type === "ruleSet") {
      navigate("/house-rules");
    } else {
      navigate("/tournaments");
    }
    setIsOpen(false);
  };

  const handleSelectItem = (item: ContextItem) => {
    onSelect(item.id);
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center">
        {label}
      </span>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className={`relative flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border transition-all text-left min-h-[48px] ${
              isActive
                ? "bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)] animate-pulse-subtle"
                : "bg-card border-border hover:border-muted-foreground/50"
            }`}
          >
            <span
              className={`text-sm font-medium truncate ${
                isActive ? "text-emerald-400" : "text-muted-foreground"
              }`}
            >
              {displayText}
            </span>
            <ChevronDown className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-emerald-400" : "text-muted-foreground"}`} />
            {isActive && (
              <div className="absolute inset-0 rounded-lg bg-emerald-500/5 animate-pulse pointer-events-none" />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 max-h-[300px] overflow-y-auto">
          {isActive ? (
            <>
              <DropdownMenuItem onClick={handleChangeNavigation}>
                Change {type === "ruleSet" ? "Rules Set" : "Tournament"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onClear} className="text-destructive focus:text-destructive">
                <X className="h-4 w-4 mr-2" />
                Turn Off
              </DropdownMenuItem>
              {availableItems.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Quick Switch
                  </div>
                  {availableItems.slice(0, 5).map((item) => (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => handleSelectItem(item)}
                      className={item.id === activeItem?.id ? "bg-accent" : ""}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm">{item.name}</span>
                        <span className="text-xs text-muted-foreground">{item.gameName}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </>
          ) : (
            <>
              <DropdownMenuItem onClick={handleChangeNavigation}>
                Choose a {type === "ruleSet" ? "Rule Set" : "Tournament"}
              </DropdownMenuItem>
              {availableItems.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Recent {type === "ruleSet" ? "Rule Sets" : "Tournaments"}
                  </div>
                  {availableItems.slice(0, 5).map((item) => (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => handleSelectItem(item)}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm">{item.name}</span>
                        <span className="text-xs text-muted-foreground">{item.gameName}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
