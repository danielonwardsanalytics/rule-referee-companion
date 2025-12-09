import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Calendar, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface LinkedTournamentsSectionProps {
  ruleSetId: string;
  ruleSetName: string;
  gameId: string;
}

interface LinkedTournament {
  id: string;
  name: string;
  updated_at: string;
  games: { name: string; image_url: string | null };
  tournament_players: Array<{ id: string; display_name: string; wins: number }>;
}

export const LinkedTournamentsSection = ({ ruleSetId, ruleSetName, gameId }: LinkedTournamentsSectionProps) => {
  const navigate = useNavigate();
  
  const handleStartNewTournament = () => {
    navigate(`/create-tournament?gameId=${gameId}&ruleSetId=${ruleSetId}`);
  };

  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ["linked-tournaments", ruleSetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournaments")
        .select(`
          id,
          name,
          updated_at,
          games(name, image_url),
          tournament_players(id, display_name, wins)
        `)
        .eq("house_rule_set_id", ruleSetId)
        .eq("is_active", true)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as unknown as LinkedTournament[];
    },
    enabled: !!ruleSetId,
  });

  const getLeader = (players: LinkedTournament["tournament_players"]) => {
    if (!players || players.length === 0) return null;
    return players.reduce((leader, player) => 
      (player.wins || 0) > (leader.wins || 0) ? player : leader
    , players[0]);
  };

  if (isLoading) {
    return (
      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="text-lg">{ruleSetName} Tournaments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          {ruleSetName} Tournaments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {tournaments.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No tournaments are using this rule set yet.
          </p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
            {tournaments.map((tournament) => {
              const leader = getLeader(tournament.tournament_players);
              return (
                <div
                  key={tournament.id}
                  onClick={() => navigate(`/tournaments/${tournament.id}`)}
                  className="flex-shrink-0 w-64 bg-[#151820] rounded-xl border border-border/50 cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg"
                >
                  {/* Tournament Image */}
                  <div className="h-24 bg-gradient-to-br from-primary/20 to-primary/5 rounded-t-xl flex items-center justify-center">
                    <Trophy className="h-10 w-10 text-primary/60" />
                  </div>
                  
                  {/* Tournament Info */}
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-sm text-foreground truncate">
                      {tournament.name}
                    </h3>
                    
                    {leader && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Trophy className="h-3 w-3 text-amber-500" />
                        <span className="truncate">{leader.display_name}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{tournament.tournament_players.length} players</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDistanceToNow(new Date(tournament.updated_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Start New Tournament Button */}
        <Button 
          onClick={handleStartNewTournament}
          className="w-full"
          variant="outline"
        >
          <Plus className="h-4 w-4 mr-2" />
          Start New Tournament
        </Button>
      </CardContent>
    </Card>
  );
};