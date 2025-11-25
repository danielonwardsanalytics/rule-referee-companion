import { usePendingInvitations } from "@/hooks/usePendingInvitations";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

export const PendingInvitationsBanner = () => {
  const { pendingInvitations, hasPendingInvitations } = usePendingInvitations();
  const navigate = useNavigate();

  if (!hasPendingInvitations) return null;

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">
              You have {pendingInvitations.length} pending tournament{" "}
              {pendingInvitations.length === 1 ? "invitation" : "invitations"}!
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              You've been invited to join tournaments. They'll appear automatically once
              you're added.
            </p>
            <div className="space-y-2">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.tournament_id}
                  className="flex items-center justify-between p-2 bg-background rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => navigate(`/tournament/${invitation.tournament_id}`)}
                >
                  <div>
                    <p className="font-medium text-sm">{invitation.tournament_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {invitation.game_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Expires{" "}
                      {formatDistanceToNow(new Date(invitation.expires_at), {
                        addSuffix: true,
                      })}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
