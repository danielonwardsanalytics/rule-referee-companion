import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, FileText, BookOpen, ChevronDown, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useHouseRuleSets } from "@/hooks/useHouseRuleSets";
import { useAllGames } from "@/hooks/useAllGames";
import { usePremium } from "@/hooks/usePremium";
import { RuleSetCard } from "@/components/house-rules/RuleSetCard";
import { CreateRuleSetModal } from "@/components/house-rules/CreateRuleSetModal";
import { PremiumGate } from "@/components/premium/PremiumGate";
import { TrialBanner } from "@/components/premium/TrialBanner";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SortOption = "game" | "date_added" | "date_updated";

const sortLabels: Record<SortOption, string> = {
  game: "Game",
  date_added: "Date Added",
  date_updated: "Date Updated",
};

const HouseRules = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { ruleSets, isLoading: ruleSetsLoading } = useHouseRuleSets();
  const { games, isLoading: gamesLoading } = useAllGames();
  const { hasPremiumAccess } = usePremium();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("game");

  // Get return context from URL params (for tournament flow)
  const returnTo = searchParams.get("returnTo");
  const preselectedGameId = searchParams.get("gameId");

  // Auto-open create modal if coming from tournament with preselected game
  useEffect(() => {
    if (returnTo && preselectedGameId) {
      setIsCreateModalOpen(true);
    }
  }, [returnTo, preselectedGameId]);

  const isLoading = ruleSetsLoading || gamesLoading;

  // Handle selecting a rule set - if coming from tournament, lock it in
  const handleRuleSetClick = async (ruleSetId: string) => {
    if (returnTo) {
      // Extract tournament ID from returnTo URL
      const tournamentIdMatch = returnTo.match(/\/tournament\/([^?]+)/);
      const tournamentId = tournamentIdMatch ? tournamentIdMatch[1] : null;

      if (tournamentId) {
        // Lock the rule set into the tournament
        const { error } = await supabase
          .from("tournaments")
          .update({ house_rule_set_id: ruleSetId })
          .eq("id", tournamentId);

        if (error) {
          console.error("Failed to lock rule set:", error);
          toast.error("Failed to lock rule set into tournament");
          return;
        }
        
        toast.success("House rules locked into tournament!");
      }
      
      navigate(returnTo);
    } else {
      navigate(`/house-rules/${ruleSetId}`);
    }
  };

  // Filter rule sets for tournament game if coming from tournament
  const filteredRuleSets = useMemo(() => {
    if (preselectedGameId) {
      return ruleSets.filter(rs => rs.game_id === preselectedGameId);
    }
    return ruleSets;
  }, [ruleSets, preselectedGameId]);

  // Group rule sets by game (for "game" sort)
  const ruleSetsByGame = useMemo(() => {
    return filteredRuleSets.reduce((acc, ruleSet) => {
      const gameId = ruleSet.game_id;
      if (!acc[gameId]) {
        acc[gameId] = [];
      }
      acc[gameId].push(ruleSet);
      return acc;
    }, {} as Record<string, typeof filteredRuleSets>);
  }, [filteredRuleSets]);

  // Sorted rule sets for date-based sorting
  const sortedRuleSets = useMemo(() => {
    if (sortBy === "game") return [];
    
    return [...filteredRuleSets].sort((a, b) => {
      if (sortBy === "date_added") {
        return new Date(b.created_at || b.updated_at).getTime() - new Date(a.created_at || a.updated_at).getTime();
      }
      // date_updated
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [filteredRuleSets, sortBy]);

  // Sorted game entries for alphabetical game grouping, with rules within each game sorted by updated_at
  const sortedGameEntries = useMemo(() => {
    return Object.entries(ruleSetsByGame)
      .sort(([, setsA], [, setsB]) => {
        const gameA = setsA[0]?.games?.name || "";
        const gameB = setsB[0]?.games?.name || "";
        return gameA.localeCompare(gameB);
      })
      .map(([gameId, sets]) => [
        gameId,
        [...sets].sort((a, b) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
      ] as [string, typeof sets]);
  }, [ruleSetsByGame]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading house rules..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TrialBanner />
      <PremiumGate feature="House Rules">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Back button when coming from tournament */}
        {returnTo && (
          <Button 
            variant="ghost" 
            onClick={() => navigate(returnTo)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tournament
          </Button>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-down">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold">
              {returnTo ? "Choose Your Rule Set" : "My House Rules"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {returnTo 
                ? "Select or create a rule set to lock into your tournament"
                : "Create and manage custom rule sets for your games"}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => navigate("/public-house-rules")} className="button-press w-full sm:w-auto">
              <BookOpen className="h-4 w-4 mr-2" />
              Browse Public Rules
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)} className="button-press w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Create New Rule Set
            </Button>
          </div>
        </div>

        {/* Sort By Dropdown - hide when in tournament mode with preselected game */}
        {filteredRuleSets.length > 0 && !returnTo && (
          <div className="flex justify-center sm:justify-start">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="button-press">
                  Sort By: {sortLabels[sortBy]}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-background border-border">
                {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                  <DropdownMenuItem
                    key={option}
                    onClick={() => setSortBy(option)}
                    className={sortBy === option ? "bg-accent" : ""}
                  >
                    {sortLabels[option]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Rule Sets */}
        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {filteredRuleSets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  {returnTo 
                    ? "No house rule sets found for this game"
                    : "You haven't created any house rule sets yet"}
                </p>
                <Button onClick={() => setIsCreateModalOpen(true)} className="button-press">
                  <Plus className="h-4 w-4 mr-2" />
                  Create {returnTo ? "New" : "Your First"} Rule Set
                </Button>
              </CardContent>
            </Card>
          ) : sortBy === "game" && !returnTo ? (
            // Grouped by game (alphabetically)
            <div className="space-y-8">
              {sortedGameEntries.map(([gameId, sets]) => {
                const game = games.find((g) => g.id === gameId);
                if (!game) return null;

                return (
                  <div key={gameId} className="animate-slide-in-left">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-1 h-8 rounded-full"
                        style={{ backgroundColor: game.accent_color }}
                      />
                      <h2 className="text-2xl font-bold">{game.name}</h2>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {sets.map((ruleSet, index) => (
                        <div key={ruleSet.id} style={{ animationDelay: `${index * 0.05}s` }}>
                          <RuleSetCard
                            ruleSet={ruleSet}
                            onClick={() => handleRuleSetClick(ruleSet.id)}
                            showGameName={false}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Flat list (for date sorting or tournament mode)
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(returnTo ? filteredRuleSets : sortedRuleSets).map((ruleSet, index) => (
                <div key={ruleSet.id} style={{ animationDelay: `${index * 0.05}s` }}>
                  <RuleSetCard
                    ruleSet={ruleSet}
                    onClick={() => handleRuleSetClick(ruleSet.id)}
                    showGameName={!returnTo}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateRuleSetModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          // If we came from a tournament and canceled, go back
          if (returnTo && !isCreateModalOpen) {
            navigate(returnTo);
          }
        }}
        games={games}
        preselectedGameId={preselectedGameId || undefined}
        returnTo={returnTo || undefined}
      />
      </PremiumGate>
    </div>
  );
};

export default HouseRules;
