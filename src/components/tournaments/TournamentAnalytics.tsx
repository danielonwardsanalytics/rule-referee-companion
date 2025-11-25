import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTournamentAnalytics } from "@/hooks/useTournamentAnalytics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Trophy, TrendingUp, Users, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TournamentAnalyticsProps {
  tournamentId: string;
  accentColor: string;
}

export const TournamentAnalytics = ({ tournamentId, accentColor }: TournamentAnalyticsProps) => {
  const { analytics, isLoading } = useTournamentAnalytics(tournamentId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analytics) return null;

  const { playerStats, totalGames, activityTimeline, topPerformer, recentWinner } = analytics;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Games</p>
                <p className="text-3xl font-bold">{totalGames}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-accent/10">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Players</p>
                <p className="text-3xl font-bold">{playerStats.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-secondary/10">
                <TrendingUp className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Top Performer</p>
                <p className="text-lg font-bold truncate">
                  {topPerformer?.display_name || "N/A"}
                </p>
                {topPerformer && (
                  <p className="text-xs text-muted-foreground">
                    {topPerformer.wins} wins ({topPerformer.win_rate.toFixed(0)}% rate)
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Player Win Rates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Win Rate Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          {playerStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={playerStats}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="display_name" 
                  className="text-xs"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis className="text-xs" label={{ value: "Win Rate (%)", angle: -90, position: "insideLeft" }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--background))", 
                    border: "1px solid hsl(var(--border))" 
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, "Win Rate"]}
                />
                <Bar dataKey="win_rate" radius={[8, 8, 0, 0]}>
                  {playerStats.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 0 ? accentColor : "hsl(var(--primary))"}
                      opacity={index === 0 ? 1 : 0.6}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No game data yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activityTimeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={activityTimeline}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--background))", 
                    border: "1px solid hsl(var(--border))" 
                  }}
                  formatter={(value: number) => [`${value}`, "Games"]}
                />
                <Bar dataKey="games" fill={accentColor} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              No recent activity
            </div>
          )}
        </CardContent>
      </Card>

      {/* Player Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Player Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {playerStats.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div 
                    className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm"
                    style={{ 
                      backgroundColor: index === 0 ? accentColor : "hsl(var(--muted))",
                      color: index === 0 ? "white" : "hsl(var(--foreground))"
                    }}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{player.display_name}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span>{player.wins}W - {player.losses}L</span>
                      <span>•</span>
                      <span>{player.win_rate.toFixed(1)}% win rate</span>
                      {player.recent_form.length > 0 && (
                        <>
                          <span>•</span>
                          <div className="flex gap-1">
                            {player.recent_form.map((result, i) => (
                              <span
                                key={i}
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                  result === "W"
                                    ? "bg-green-500/20 text-green-600"
                                    : "bg-red-500/20 text-red-600"
                                }`}
                              >
                                {result}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{player.points}</p>
                  <p className="text-xs text-muted-foreground">points</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
