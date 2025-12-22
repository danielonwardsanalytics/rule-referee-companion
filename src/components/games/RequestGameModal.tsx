import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useGameSuggestions } from "@/hooks/useGameSuggestions";
import { useAuth } from "@/hooks/useAuth";

interface RequestGameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillGameName?: string;
}

export const RequestGameModal = ({
  open,
  onOpenChange,
  prefillGameName = "",
}: RequestGameModalProps) => {
  const { user } = useAuth();
  const { submitSuggestion, isSubmitting } = useGameSuggestions();
  const [gameName, setGameName] = useState(prefillGameName);
  const [reason, setReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameName.trim()) return;

    submitSuggestion(
      {
        game_name: gameName.trim(),
        reason: reason.trim() || undefined,
      },
      {
        onSuccess: () => {
          setGameName("");
          setReason("");
          onOpenChange(false);
        },
      }
    );
  };

  // Reset form when modal opens with prefill
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && prefillGameName) {
      setGameName(prefillGameName);
    }
    if (!newOpen) {
      setGameName("");
      setReason("");
    }
    onOpenChange(newOpen);
  };

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in Required</DialogTitle>
            <DialogDescription>
              Please sign in to request a new game.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Request a Game</DialogTitle>
            <DialogDescription>
              Can't find the game you're looking for? Let us know and we'll consider adding it!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="gameName">Game Name *</Label>
              <Input
                id="gameName"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder="e.g., Catan, Ticket to Ride"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Why would you like this game? (optional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Tell us why you'd like to see this game added..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!gameName.trim() || isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
