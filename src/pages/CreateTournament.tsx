import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAllGames } from "@/hooks/useAllGames";
import { useTournaments } from "@/hooks/useTournaments";
import { usePremium } from "@/hooks/usePremium";
import { Loader2, ArrowLeft, Crown } from "lucide-react";
import { toast } from "sonner";
import { UpgradeModal } from "@/components/premium/UpgradeModal";

const CreateTournament = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { games, isLoading: gamesLoading } = useAllGames();
  const { createTournament, isCreating, tournaments } = useTournaments();
  const { hasPremiumAccess } = usePremium();
  
  // Get pre-selected values from URL params
  const preSelectedGameId = searchParams.get("gameId") || "";
  const preSelectedRuleSetId = searchParams.get("ruleSetId") || "";
  
  const [name, setName] = useState("");
  const [gameId, setGameId] = useState(preSelectedGameId);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  
  // Update gameId when URL param changes
  useEffect(() => {
    if (preSelectedGameId) {
      setGameId(preSelectedGameId);
    }
  }, [preSelectedGameId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !gameId) return;

    // Check if free user already has an active tournament for this game
    if (!hasPremiumAccess) {
      const existingTournament = tournaments.find(
        (t) => t.game_id === gameId && t.is_active
      );
      
      if (existingTournament) {
        toast.error("Free users can only have 1 active tournament per game");
        setIsUpgradeModalOpen(true);
        return;
      }
    }

    createTournament(
      { 
        name, 
        gameId,
        houseRuleSetId: preSelectedRuleSetId || undefined,
      },
      {
        onSuccess: (tournament) => {
          navigate(`/tournament/${tournament.id}`);
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/tournaments")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tournaments
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Create Tournament</CardTitle>
            <CardDescription>
              Set up a new tournament to track games and leaderboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Tournament Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Friday Night UNO"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="game">Game</Label>
                {gamesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : (
                  <Select value={gameId} onValueChange={setGameId} required>
                    <SelectTrigger id="game">
                      <SelectValue placeholder="Select a game" />
                    </SelectTrigger>
                    <SelectContent>
                      {games.map((game) => (
                        <SelectItem key={game.id} value={game.id}>
                          {game.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Tournament
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        feature="Multiple Active Tournaments"
      />
    </div>
  );
};

export default CreateTournament;
