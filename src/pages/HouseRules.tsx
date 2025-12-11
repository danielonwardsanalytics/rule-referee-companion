import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, FileText, BookOpen, ChevronDown } from "lucide-react";
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
  const { ruleSets, isLoading: ruleSetsLoading } = useHouseRuleSets();
  const { games, isLoading: gamesLoading } = useAllGames();
  const { hasPremiumAccess } = usePremium();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("game");

  const isLoading = ruleSetsLoading || gamesLoading;

  // Group rule sets by game (for "game" sort)
  const ruleSetsByGame = useMemo(() => {
    return ruleSets.reduce((acc, ruleSet) => {
      const gameId = ruleSet.game_id;
      if (!acc[gameId]) {
        acc[gameId] = [];
      }
      acc[gameId].push(ruleSet);
      return acc;
    }, {} as Record<string, typeof ruleSets>);
  }, [ruleSets]);

  // Sorted rule sets for date-based sorting
  const sortedRuleSets = useMemo(() => {
    if (sortBy === "game") return [];
    
    return [...ruleSets].sort((a, b) => {
      if (sortBy === "date_added") {
        return new Date(b.created_at || b.updated_at).getTime() - new Date(a.created_at || a.updated_at).getTime();
      }
      // date_updated
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [ruleSets, sortBy]);

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-down">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold">My House Rules</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage custom rule sets for your games
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

        {/* Sort By Dropdown */}
        {ruleSets.length > 0 && (
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
          {ruleSets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  You haven't created any house rule sets yet
                </p>
                <Button onClick={() => setIsCreateModalOpen(true)} className="button-press">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Rule Set
                </Button>
              </CardContent>
            </Card>
          ) : sortBy === "game" ? (
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
                            onClick={() => navigate(`/house-rules/${ruleSet.id}`)}
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
            // Flat list sorted by date
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedRuleSets.map((ruleSet, index) => (
                <div key={ruleSet.id} style={{ animationDelay: `${index * 0.05}s` }}>
                  <RuleSetCard
                    ruleSet={ruleSet}
                    onClick={() => navigate(`/house-rules/${ruleSet.id}`)}
                    showGameName={true}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateRuleSetModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        games={games}
      />
      </PremiumGate>
    </div>
  );
};

export default HouseRules;
