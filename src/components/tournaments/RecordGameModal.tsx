import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useGameResults } from "@/hooks/useGameResults";
import { Loader2 } from "lucide-react";

interface Player {
  id: string;
  display_name: string;
}

interface RecordGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  players: Player[];
}

export const RecordGameModal = ({
  isOpen,
  onClose,
  tournamentId,
  players,
}: RecordGameModalProps) => {
  const [winnerId, setWinnerId] = useState("");
  const { recordGame, isRecording } = useGameResults(tournamentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!winnerId) return;

    recordGame(
      { tournamentId, winnerId },
      {
        onSuccess: () => {
          setWinnerId("");
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Game Winner</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label>Select Winner</Label>
            <RadioGroup value={winnerId} onValueChange={setWinnerId}>
              {players.map((player) => (
                <div key={player.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={player.id} id={player.id} />
                  <Label htmlFor={player.id} className="flex-1 cursor-pointer">
                    {player.display_name}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div className="flex gap-2">
            <Button
              type="submit"
              className="flex-1"
              disabled={!winnerId || isRecording}
            >
              {isRecording && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Winner
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
