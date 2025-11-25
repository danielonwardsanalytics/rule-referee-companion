import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, X, Mail, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface FriendRequest {
  id: string;
  requester_id: string;
  recipient_email: string | null;
  created_at: string;
  profiles?: {
    display_name: string | null;
    email: string;
  };
}

interface FriendRequestItemProps {
  request: FriendRequest;
  type: "received" | "sent";
  onUpdate: () => void;
}

export const FriendRequestItem = ({ request, type, onUpdate }: FriendRequestItemProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update request status
      const { error: updateError } = await supabase
        .from("friend_requests")
        .update({ status: "accepted" })
        .eq("id", request.id);

      if (updateError) throw updateError;

      // Create friendship (both directions)
      const { error: friendError } = await supabase
        .from("friends")
        .insert([
          { user_id: user.id, friend_id: request.requester_id },
          { user_id: request.requester_id, friend_id: user.id },
        ]);

      if (friendError) throw friendError;

      toast({
        title: "Friend Request Accepted",
        description: "You are now friends!",
      });

      onUpdate();
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast({
        title: "Error",
        description: "Failed to accept friend request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("friend_requests")
        .update({ status: "rejected" })
        .eq("id", request.id);

      if (error) throw error;

      toast({
        title: "Friend Request Rejected",
        description: "The request has been declined",
      });

      onUpdate();
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      toast({
        title: "Error",
        description: "Failed to reject friend request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const displayName = request.profiles?.display_name || request.profiles?.email || request.recipient_email || "Unknown User";

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{displayName}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {request.profiles?.email || request.recipient_email}
            </p>
          </div>
        </div>

        {type === "received" && (
          <div className="flex gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="default"
              onClick={handleAccept}
              disabled={isProcessing}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReject}
              disabled={isProcessing}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {type === "sent" && (
          <div className="text-sm text-muted-foreground flex-shrink-0">
            Pending
          </div>
        )}
      </div>
    </Card>
  );
};
