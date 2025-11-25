import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Loader2 } from "lucide-react";
import { useHouseRuleSets } from "@/hooks/useHouseRuleSets";
import { useAllGames } from "@/hooks/useAllGames";
import { usePremium } from "@/hooks/usePremium";
import { RuleSetCard } from "@/components/house-rules/RuleSetCard";
import { CreateRuleSetModal } from "@/components/house-rules/CreateRuleSetModal";
import { PremiumGate } from "@/components/premium/PremiumGate";
import { TrialBanner } from "@/components/premium/TrialBanner";

const HouseRules = () => {
  const navigate = useNavigate();
  const { ruleSets, isLoading: ruleSetsLoading } = useHouseRuleSets();
  const { games, isLoading: gamesLoading } = useAllGames();
  const { hasPremiumAccess } = usePremium();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const isLoading = ruleSetsLoading || gamesLoading;

  // Group rule sets by game
  const ruleSetsByGame = ruleSets.reduce((acc, ruleSet) => {
    const gameId = ruleSet.game_id;
    if (!acc[gameId]) {
      acc[gameId] = [];
    }
    acc[gameId].push(ruleSet);
    return acc;
  }, {} as Record<string, typeof ruleSets>);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TrialBanner />
      <PremiumGate feature="House Rules">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My House Rules</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage custom rule sets for your games
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Rule Set
          </Button>
        </div>

        {/* Rule Sets by Game */}
        {ruleSets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                You haven't created any house rule sets yet
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Rule Set
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(ruleSetsByGame).map(([gameId, sets]) => {
              const game = games.find((g) => g.id === gameId);
              if (!game) return null;

              return (
                <div key={gameId}>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-1 h-8 rounded-full"
                      style={{ backgroundColor: game.accent_color }}
                    />
                    <h2 className="text-2xl font-bold">{game.name}</h2>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {sets.map((ruleSet) => (
                      <RuleSetCard
                        key={ruleSet.id}
                        ruleSet={ruleSet}
                        onClick={() => navigate(`/house-rules/${ruleSet.id}`)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
