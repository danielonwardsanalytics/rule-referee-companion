import { Button } from "@/components/ui/button";
import { Plus, Loader2, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTournaments } from "@/hooks/useTournaments";
import { TournamentCard } from "@/components/tournaments/TournamentCard";
import { PendingInvitationsBanner } from "@/components/tournaments/PendingInvitationsBanner";

const Tournaments = () => {
  const navigate = useNavigate();
  const { tournaments, isLoading } = useTournaments();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tournaments</h1>
            <p className="text-muted-foreground mt-1">
              Track games and standings across your tournaments
            </p>
          </div>
          <Button onClick={() => navigate("/tournaments/create")}>
            <Plus className="mr-2 h-4 w-4" />
            New Tournament
          </Button>
        </div>

        {/* Pending Invitations Banner */}
        <PendingInvitationsBanner />

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-card rounded-xl border border-border p-12">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No tournaments yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first tournament to start tracking games
              </p>
              <Button onClick={() => navigate("/tournaments/create")}>
                <Plus className="mr-2 h-4 w-4" />
                Create Tournament
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tournaments;
