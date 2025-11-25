import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAllGames } from "@/hooks/useAllGames";
import { useTournaments } from "@/hooks/useTournaments";
import { Loader2, ArrowLeft } from "lucide-react";

const CreateTournament = () => {
  const navigate = useNavigate();
  const { games, isLoading: gamesLoading } = useAllGames();
  const { createTournament, isCreating } = useTournaments();
  const [name, setName] = useState("");
  const [gameId, setGameId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !gameId) return;

    createTournament(
      { name, gameId },
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
    </div>
  );
};

export default CreateTournament;
