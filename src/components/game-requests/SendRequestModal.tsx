import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send } from "lucide-react";
import { useAllGames } from "@/hooks/useAllGames";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SendRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
  onSuccess: () => void;
}

export const SendRequestModal = ({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  onSuccess,
}: SendRequestModalProps) => {
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { games, isLoading: gamesLoading } = useAllGames();
  const { toast } = useToast();

  const handleSendRequest = async () => {
    if (!selectedGameId) {
      toast({
        title: "Game Required",
        description: "Please select a game",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check for existing pending request
      const { data: existingRequest } = await supabase
        .from("game_requests")
        .select("id")
        .eq("requester_id", user.id)
        .eq("recipient_id", recipientId)
        .eq("game_id", selectedGameId)
        .eq("status", "pending")
        .maybeSingle();

      if (existingRequest) {
        toast({
          title: "Request Already Sent",
          description: "You already have a pending request for this game with this friend",
          variant: "destructive",
        });
        setIsSending(false);
        return;
      }

      // Create game request
      const { error } = await supabase
        .from("game_requests")
        .insert({
          requester_id: user.id,
          recipient_id: recipientId,
          game_id: selectedGameId,
          message: message.trim() || null,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Request Sent",
        description: `Game request sent to ${recipientName}`,
      });

      setSelectedGameId("");
      setMessage("");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error sending game request:", error);
      toast({
        title: "Error",
        description: "Failed to send request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Game Request to {recipientName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="game">Select Game</Label>
            {gamesLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              <Select value={selectedGameId} onValueChange={setSelectedGameId}>
                <SelectTrigger id="game">
                  <SelectValue placeholder="Choose a game" />
                </SelectTrigger>
                <SelectContent>
                  {games?.map((game) => (
                    <SelectItem key={game.id} value={game.id}>
                      {game.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a message to your request..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSendRequest}
              disabled={!selectedGameId || isSending}
              className="flex-1"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Request
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
