import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHouseRuleSets } from "@/hooks/useHouseRuleSets";
import { useNavigate } from "react-router-dom";

interface CreateRuleSetModalProps {
  isOpen: boolean;
  onClose: () => void;
  games: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export const CreateRuleSetModal = ({
  isOpen,
  onClose,
  games,
}: CreateRuleSetModalProps) => {
  const navigate = useNavigate();
  const { createRuleSet, isCreating } = useHouseRuleSets();
  const [name, setName] = useState("");
  const [gameId, setGameId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !gameId) return;

    createRuleSet(
      { name: name.trim(), gameId },
      {
        onSuccess: () => {
          setName("");
          setGameId("");
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Rule Set</DialogTitle>
          <DialogDescription>
            Create a custom set of house rules for any game
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="game">Game</Label>
            <Select value={gameId} onValueChange={setGameId}>
              <SelectTrigger id="game">
                <SelectValue placeholder="Select a game" />
              </SelectTrigger>
              <SelectContent>
                {games.map((game) => (
                  <SelectItem key={game.id} value={game.id}>
                    {game.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Rule Set Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Family Friendly Rules"
              required
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !name.trim() || !gameId}>
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
