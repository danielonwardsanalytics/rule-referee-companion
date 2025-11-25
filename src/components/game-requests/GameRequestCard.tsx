import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, User, Calendar, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface GameRequestCardProps {
  request: {
    id: string;
    created_at: string;
    message: string | null;
    status: string;
    game: {
      name: string;
      accent_color: string | null;
    };
    requester?: {
      display_name: string | null;
      email: string;
    };
    recipient?: {
      display_name: string | null;
      email: string;
    };
  };
  type: "received" | "sent";
  onUpdate: () => void;
}

export const GameRequestCard = ({ request, type, onUpdate }: GameRequestCardProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const otherUser = type === "received" ? request.requester : request.recipient;
  const displayName = otherUser?.display_name || otherUser?.email || "Unknown User";

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("game_requests")
        .update({ status: "accepted" })
        .eq("id", request.id);

      if (error) throw error;

      toast({
        title: "Request Accepted",
        description: "You can now plan your game!",
      });

      onUpdate();
    } catch (error) {
      console.error("Error accepting request:", error);
      toast({
        title: "Error",
        description: "Failed to accept request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("game_requests")
        .update({ status: "declined" })
        .eq("id", request.id);

      if (error) throw error;

      toast({
        title: "Request Declined",
        description: "The request has been declined",
      });

      onUpdate();
    } catch (error) {
      console.error("Error declining request:", error);
      toast({
        title: "Error",
        description: "Failed to decline request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = () => {
    switch (request.status) {
      case "accepted":
        return <Badge className="bg-green-500">Accepted</Badge>;
      case "declined":
        return <Badge variant="destructive">Declined</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <Card
      className="hover:shadow-md transition-shadow"
      style={{
        borderLeft: `4px solid ${request.game.accent_color || "hsl(var(--primary))"}`,
      }}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{displayName}</p>
                <p className="text-sm text-muted-foreground">
                  {type === "received" ? "wants to play" : "invited to play"}
                </p>
              </div>
            </div>
            {getStatusBadge()}
          </div>

          {/* Game */}
          <div className="flex items-center gap-2 text-sm">
            <div
              className="w-1 h-6 rounded-full"
              style={{ backgroundColor: request.game.accent_color || "hsl(var(--primary))" }}
            />
            <span className="font-semibold">{request.game.name}</span>
          </div>

          {/* Message */}
          {request.message && (
            <div className="flex gap-2 text-sm bg-muted/50 p-3 rounded-lg">
              <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-muted-foreground">{request.message}</p>
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
            </span>
          </div>

          {/* Actions */}
          {type === "received" && request.status === "pending" && (
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={handleAccept}
                disabled={isProcessing}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDecline}
                disabled={isProcessing}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-1" />
                Decline
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
