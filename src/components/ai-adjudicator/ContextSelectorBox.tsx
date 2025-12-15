import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
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

  // Get only the last used item (first in the sorted list)
  const lastUsedItem = availableItems.length > 0 ? availableItems[0] : null;

  const handleChooseNavigation = () => {
    if (type === "ruleSet") {
      navigate("/house-rules");
    } else {
      navigate("/tournaments");
    }
    setIsOpen(false);
  };

  const handleSelectItem = (item: ContextItem) => {
    onSelect(item.id);
    // Navigate to the detail page for the selected item
    if (type === "ruleSet") {
      navigate(`/house-rules/${item.id}`);
    } else {
      navigate(`/tournament/${item.id}`);
    }
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
      {/* Label with On/Off indicator for Rule Sets */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        {type === "ruleSet" && (
          <div className="flex items-center gap-1">
            <Switch
              checked={isActive}
              onCheckedChange={() => {
                if (isActive) {
                  onClear();
                }
              }}
              disabled={!isActive}
              className={`h-4 w-7 ${isActive ? "bg-green-500 data-[state=checked]:bg-green-500" : "bg-red-500 data-[state=unchecked]:bg-red-500"}`}
            />
          </div>
        )}
      </div>
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
              <DropdownMenuItem onClick={handleChooseNavigation}>
                Change {type === "ruleSet" ? "Rules Set" : "Tournament"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onClear} className="text-destructive focus:text-destructive">
                <X className="h-4 w-4 mr-2" />
                Turn Off
              </DropdownMenuItem>
              {lastUsedItem && lastUsedItem.id !== activeItem?.id && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Last {type === "ruleSet" ? "Rule Set" : "Tournament"} Used
                  </div>
                  <DropdownMenuItem
                    onClick={() => handleSelectItem(lastUsedItem)}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm">{lastUsedItem.name}</span>
                      <span className="text-xs text-muted-foreground">{lastUsedItem.gameName}</span>
                    </div>
                  </DropdownMenuItem>
                </>
              )}
            </>
          ) : (
            <>
              <DropdownMenuItem onClick={handleChooseNavigation}>
                Choose a {type === "ruleSet" ? "Rule Set" : "Tournament"}
              </DropdownMenuItem>
              {lastUsedItem && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Last {type === "ruleSet" ? "Rule Set" : "Tournament"} Used
                  </div>
                  <DropdownMenuItem
                    onClick={() => handleSelectItem(lastUsedItem)}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm">{lastUsedItem.name}</span>
                      <span className="text-xs text-muted-foreground">{lastUsedItem.gameName}</span>
                    </div>
                  </DropdownMenuItem>
                </>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
