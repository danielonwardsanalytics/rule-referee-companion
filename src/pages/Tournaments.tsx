import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trophy, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTournaments } from "@/hooks/useTournaments";
import { TournamentCard } from "@/components/tournaments/TournamentCard";
import { PendingInvitationsBanner } from "@/components/tournaments/PendingInvitationsBanner";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SortOption = "game" | "date_added" | "date_updated";

const Tournaments = () => {
  const navigate = useNavigate();
  const { tournaments, isLoading } = useTournaments();
  const [sortBy, setSortBy] = useState<SortOption>("game");

  const sortLabels: Record<SortOption, string> = {
    game: "Game",
    date_added: "Date Added",
    date_updated: "Date Updated",
  };

  // Group tournaments by game
  const tournamentsByGame = useMemo(() => {
    const grouped: Record<string, typeof tournaments> = {};
    tournaments.forEach((tournament) => {
      const gameName = tournament.games.name;
      if (!grouped[gameName]) {
        grouped[gameName] = [];
      }
      grouped[gameName].push(tournament);
    });
    // Sort tournaments within each game by date updated (most recent first)
    Object.keys(grouped).forEach((game) => {
      grouped[game].sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });
    return grouped;
  }, [tournaments]);

  // Get sorted game entries (alphabetically)
  const sortedGameEntries = useMemo(() => {
    return Object.entries(tournamentsByGame).sort(([a], [b]) => a.localeCompare(b));
  }, [tournamentsByGame]);

  // Flat sorted list for date sorting
  const sortedTournaments = useMemo(() => {
    const sorted = [...tournaments];
    if (sortBy === "date_added") {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === "date_updated") {
      sorted.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }
    return sorted;
  }, [tournaments, sortBy]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col gap-4 animate-slide-down">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold">Tournaments</h1>
            <p className="text-muted-foreground mt-1">
              Track games and standings across your tournaments
            </p>
          </div>
          <Button onClick={() => navigate("/tournaments/create")} className="button-press w-full sm:w-auto sm:self-start" aria-label="Create new tournament">
            <Plus className="mr-2 h-4 w-4" />
            New Tournament
          </Button>
        </div>

        {/* Sort By Dropdown */}
        {tournaments.length > 0 && (
          <div className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  Sort by: {sortLabels[sortBy]}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-card border border-border">
                <DropdownMenuItem onClick={() => setSortBy("game")}>
                  Game
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("date_added")}>
                  Date Added
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("date_updated")}>
                  Date Updated
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Pending Invitations Banner */}
        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <PendingInvitationsBanner />
        </div>

        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
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
          ) : sortBy === "game" ? (
            <div className="space-y-8">
              {sortedGameEntries.map(([gameName, gameTournaments]) => (
                <div key={gameName}>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: gameTournaments[0]?.games.accent_color }}
                    />
                    {gameName}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {gameTournaments.map((tournament, index) => (
                      <div key={tournament.id} style={{ animationDelay: `${index * 0.05}s` }}>
                        <TournamentCard tournament={tournament} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedTournaments.map((tournament, index) => (
                <div key={tournament.id} style={{ animationDelay: `${index * 0.05}s` }}>
                  <TournamentCard tournament={tournament} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tournaments;
