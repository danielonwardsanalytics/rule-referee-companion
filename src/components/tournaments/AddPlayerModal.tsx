import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTournamentPlayers } from "@/hooks/useTournamentPlayers";
import { Loader2 } from "lucide-react";

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
}

export const AddPlayerModal = ({ isOpen, onClose, tournamentId }: AddPlayerModalProps) => {
  const [displayName, setDisplayName] = useState("");
  const { addPlayer, isAddingPlayer } = useTournamentPlayers(tournamentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    addPlayer(
      { tournamentId, displayName: displayName.trim() },
      {
        onSuccess: () => {
          setDisplayName("");
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Player</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="playerName">Player Name</Label>
            <Input
              id="playerName"
              placeholder="Enter player name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={isAddingPlayer}>
              {isAddingPlayer && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Player
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
