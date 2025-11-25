import { Button } from "@/components/ui/button";
import { Plus, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTournaments } from "@/hooks/useTournaments";
import { TournamentCard } from "@/components/tournaments/TournamentCard";
import { PendingInvitationsBanner } from "@/components/tournaments/PendingInvitationsBanner";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";

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
          <Button onClick={() => navigate("/tournaments/create")} aria-label="Create new tournament">
            <Plus className="mr-2 h-4 w-4" />
            New Tournament
          </Button>
        </div>

        {/* Pending Invitations Banner */}
        <PendingInvitationsBanner />

        {isLoading ? (
          <LoadingSpinner size="lg" text="Loading tournaments..." />
        ) : tournaments.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No tournaments yet"
            description="Create your first tournament to start tracking games"
            actionLabel="Create Tournament"
            onAction={() => navigate("/tournaments/create")}
          />
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
