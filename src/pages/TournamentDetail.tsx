import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Edit2, Check, X, Loader2 } from "lucide-react";
import { useTournamentDetail, useTournaments } from "@/hooks/useTournaments";
import { useTournamentPlayers } from "@/hooks/useTournamentPlayers";
import { useGameResults } from "@/hooks/useGameResults";
import { useAuth } from "@/hooks/useAuth";
import { useActiveContext } from "@/hooks/useActiveContext";
import AIAdjudicator from "@/components/AIAdjudicator";
import { LeaderboardTable } from "@/components/tournaments/LeaderboardTable";
import { AddPlayerModal } from "@/components/tournaments/AddPlayerModal";
import { RecordGameModal } from "@/components/tournaments/RecordGameModal";
import { GameHistory } from "@/components/tournaments/GameHistory";
import { TournamentAnalytics } from "@/components/tournaments/TournamentAnalytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TournamentDetail = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tournament, isLoading } = useTournamentDetail(tournamentId);
  const { updateTournament } = useTournaments();
  const { players } = useTournamentPlayers(tournamentId);
  const { results } = useGameResults(tournamentId);
  const { setActiveTournament } = useActiveContext();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [isRecordGameOpen, setIsRecordGameOpen] = useState(false);

  const isAdmin = tournament?.admin_id === user?.id;

  // Set this tournament as active when viewing the detail page
  useEffect(() => {
    if (tournamentId) {
      setActiveTournament(tournamentId);
    }
  }, [tournamentId, setActiveTournament]);

  const handleSaveName = () => {
    if (tournament && editedName.trim()) {
      updateTournament({ id: tournament.id, name: editedName });
      setIsEditingName(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Tournament not found</h1>
          <Button onClick={() => navigate("/tournaments")}>
            Back to Tournaments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/tournaments")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex-1">
            {isEditingName && isAdmin ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="max-w-md"
                  autoFocus
                />
                <Button size="icon" variant="ghost" onClick={handleSaveName}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsEditingName(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">{tournament.name}</h1>
                {isAdmin && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditedName(tournament.name);
                      setIsEditingName(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
            <p className="text-muted-foreground mt-1">{tournament.games.name}</p>
          </div>
        </div>

        {/* AI Adjudicator - Universal component, same as homepage */}
        <AIAdjudicator
          title="AI Adjudicator"
          subtitle="Get instant answers about any game rule"
          embedded
          showTournamentProTips
        />

        {/* Tournament Tabs */}
        <Tabs defaultValue="leaderboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard" className="space-y-6 mt-6">
            {/* Leaderboard */}
            <Card className="animate-fade-in overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl">Leaderboard</CardTitle>
                {isAdmin && (
                  <Button onClick={() => setIsAddPlayerOpen(true)} className="hover-scale">
                    Add Player
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <LeaderboardTable 
                  players={players} 
                  isAdmin={isAdmin}
                  accentColor={tournament.games.accent_color}
                />
              </CardContent>
            </Card>

            {/* Record Game Result */}
            {isAdmin && players.length >= 2 && (
              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle className="text-xl">Record Game Result</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setIsRecordGameOpen(true)} className="hover-scale">
                    Record Winner
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Game History */}
            {results.length > 0 && (
              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle className="text-xl">Game History</CardTitle>
                </CardHeader>
                <CardContent>
                  <GameHistory results={results} />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <TournamentAnalytics 
              tournamentId={tournament.id} 
              accentColor={tournament.games.accent_color}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <AddPlayerModal
        isOpen={isAddPlayerOpen}
        onClose={() => setIsAddPlayerOpen(false)}
        tournamentId={tournament.id}
      />
      <RecordGameModal
        isOpen={isRecordGameOpen}
        onClose={() => setIsRecordGameOpen(false)}
        tournamentId={tournament.id}
        players={players}
      />
    </div>
  );
};

export default TournamentDetail;
