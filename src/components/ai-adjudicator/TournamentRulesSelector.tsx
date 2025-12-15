import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Lock, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useHouseRuleSets } from "@/hooks/useHouseRuleSets";

interface TournamentRulesSelectorProps {
  tournamentId: string;
  gameId: string;
  gameName: string;
  lockedRuleSetId: string | null;
  lockedRuleSetName: string | null;
  isUsingHouseRules: boolean;
  onToggleRules: (useHouseRules: boolean) => void;
  onLockRuleSet: (ruleSetId: string) => void;
}

export const TournamentRulesSelector = ({
  tournamentId,
  gameId,
  gameName,
  lockedRuleSetId,
  lockedRuleSetName,
  isUsingHouseRules,
  onToggleRules,
  onLockRuleSet,
}: TournamentRulesSelectorProps) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showLockWarning, setShowLockWarning] = useState(false);
  const [selectedRuleSetId, setSelectedRuleSetId] = useState<string | null>(null);
  const [selectedRuleSetName, setSelectedRuleSetName] = useState<string>("");
  const [showRuleSetPicker, setShowRuleSetPicker] = useState(false);

  // Fetch user's rule sets for this specific game
  const { ruleSets } = useHouseRuleSets(gameId);

  const hasLockedRules = !!lockedRuleSetId;

  // Display text logic
  const getDisplayText = () => {
    if (hasLockedRules) {
      if (isUsingHouseRules) {
        return lockedRuleSetName || "House Rules";
      } else {
        return "Official Rules";
      }
    }
    return "No rules set";
  };

  const handleSelectRuleSet = (ruleSetId: string, ruleSetName: string) => {
    setSelectedRuleSetId(ruleSetId);
    setSelectedRuleSetName(ruleSetName);
    setShowRuleSetPicker(false);
    setShowLockWarning(true);
  };

  const handleConfirmLock = () => {
    if (selectedRuleSetId) {
      onLockRuleSet(selectedRuleSetId);
      onToggleRules(true);
    }
    setShowLockWarning(false);
    setSelectedRuleSetId(null);
    setSelectedRuleSetName("");
  };

  const handleCancelLock = () => {
    setShowLockWarning(false);
    setSelectedRuleSetId(null);
    setSelectedRuleSetName("");
  };

  const handleToggleToOfficial = () => {
    onToggleRules(false);
    setIsOpen(false);
  };

  const handleToggleToHouseRules = () => {
    onToggleRules(true);
    setIsOpen(false);
  };

  const handleAddHouseRules = () => {
    setIsOpen(false);
    setShowRuleSetPicker(true);
  };

  return (
    <>
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {/* Label */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Tournament Set Rules
          </span>
          {hasLockedRules && (
            <Lock className="h-3 w-3 text-amber-500" />
          )}
        </div>

        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <button
              className={`relative flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border transition-all text-left min-h-[48px] ${
                hasLockedRules && isUsingHouseRules
                  ? "bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)] animate-pulse-subtle"
                  : "bg-card border-border hover:border-muted-foreground/50"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {hasLockedRules && (
                  <Lock className="h-4 w-4 flex-shrink-0 text-amber-500" />
                )}
                <span
                  className={`text-sm font-medium truncate ${
                    hasLockedRules && isUsingHouseRules ? "text-emerald-400" : "text-muted-foreground"
                  }`}
                >
                  {getDisplayText()}
                </span>
              </div>
              <ChevronDown className={`h-4 w-4 flex-shrink-0 ${hasLockedRules && isUsingHouseRules ? "text-emerald-400" : "text-muted-foreground"}`} />
              {hasLockedRules && isUsingHouseRules && (
                <div className="absolute inset-0 rounded-lg bg-emerald-500/5 animate-pulse pointer-events-none" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {hasLockedRules ? (
              <>
                <div className="px-2 py-2 text-xs text-muted-foreground flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  <span>Locked for this tournament</span>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleToggleToHouseRules}
                  disabled={isUsingHouseRules}
                  className={isUsingHouseRules ? "bg-emerald-500/10" : ""}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Use House Rules: {lockedRuleSetName}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleToggleToOfficial}
                  disabled={!isUsingHouseRules}
                  className={!isUsingHouseRules ? "bg-secondary" : ""}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Use Official Rules
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={handleAddHouseRules}>
                  <Lock className="h-4 w-4 mr-2" />
                  Add House Rules to Tournament
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-2 text-xs text-muted-foreground">
                  Currently using official {gameName} rules
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Rule Set Picker Dialog */}
      <AlertDialog open={showRuleSetPicker} onOpenChange={setShowRuleSetPicker}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Choose House Rules</AlertDialogTitle>
            <AlertDialogDescription>
              Select a house rule set for this tournament. This will be locked in and cannot be changed later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="my-4 space-y-2 max-h-[300px] overflow-y-auto">
            {ruleSets.map((ruleSet) => (
              <button
                key={ruleSet.id}
                onClick={() => handleSelectRuleSet(ruleSet.id, ruleSet.name)}
                className="w-full p-3 text-left rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all"
              >
                <div className="font-medium">{ruleSet.name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {ruleSet.games.name}
                </div>
              </button>
            ))}
            
            {ruleSets.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <p>No house rule sets found for {gameName}.</p>
              </div>
            )}
          </div>
          
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowRuleSetPicker(false);
                // Navigate to house rules with return context
                navigate(`/house-rules?returnTo=/tournament/${tournamentId}&gameId=${gameId}`);
              }}
              className="w-full sm:w-auto"
            >
              Choose Rule Set
            </Button>
            <AlertDialogCancel className="w-full sm:w-auto mt-0">Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lock Confirmation Dialog */}
      <AlertDialog open={showLockWarning} onOpenChange={setShowLockWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-500" />
              Lock in House Rules?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You're about to lock in <strong>"{selectedRuleSetName}"</strong> as the house rules for this tournament.
              </p>
              <p className="text-amber-500 font-medium">
                ⚠️ Once locked, these house rules cannot be changed for this tournament.
              </p>
              <p>
                You can still switch between using the locked house rules and official rules during gameplay.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelLock}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLock}>
              Lock in Rules
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
