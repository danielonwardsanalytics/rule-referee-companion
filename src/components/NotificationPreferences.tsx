import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Gamepad2, UserPlus, Users } from "lucide-react";

export const NotificationPreferences = () => {
  const { preferences, isLoading, updatePreferences } = useNotificationPreferences();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Choose what notifications you'd like to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-12 w-48" />
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const prefs = preferences || {
    tournament_invites: true,
    game_results: true,
    friend_requests: true,
    game_requests: true,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Choose what notifications you'd like to receive</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <Label htmlFor="tournament-invites" className="text-base">
                Tournament Invitations
              </Label>
              <p className="text-sm text-muted-foreground">
                When you're invited to join a tournament
              </p>
            </div>
          </div>
          <Switch
            id="tournament-invites"
            checked={prefs.tournament_invites}
            onCheckedChange={(checked) =>
              updatePreferences({ tournament_invites: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Gamepad2 className="h-5 w-5 text-accent" />
            </div>
            <div>
              <Label htmlFor="game-results" className="text-base">
                Game Results
              </Label>
              <p className="text-sm text-muted-foreground">
                When new games are recorded in your tournaments
              </p>
            </div>
          </div>
          <Switch
            id="game-results"
            checked={prefs.game_results}
            onCheckedChange={(checked) =>
              updatePreferences({ game_results: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/10">
              <UserPlus className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <Label htmlFor="friend-requests" className="text-base">
                Friend Requests
              </Label>
              <p className="text-sm text-muted-foreground">
                When someone sends you a friend request
              </p>
            </div>
          </div>
          <Switch
            id="friend-requests"
            checked={prefs.friend_requests}
            onCheckedChange={(checked) =>
              updatePreferences({ friend_requests: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <Label htmlFor="game-requests" className="text-base">
                Game Requests
              </Label>
              <p className="text-sm text-muted-foreground">
                When friends want to play a game with you
              </p>
            </div>
          </div>
          <Switch
            id="game-requests"
            checked={prefs.game_requests}
            onCheckedChange={(checked) =>
              updatePreferences({ game_requests: checked })
            }
          />
        </div>
      </CardContent>
    </Card>
  );
};
