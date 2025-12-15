import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateRuleSetModalProps {
  isOpen: boolean;
  onClose: () => void;
  games: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  preselectedGameId?: string;
  returnTo?: string;
}

export const CreateRuleSetModal = ({
  isOpen,
  onClose,
  games,
  preselectedGameId,
  returnTo,
}: CreateRuleSetModalProps) => {
  const navigate = useNavigate();
  const { createRuleSet, isCreating } = useHouseRuleSets();
  const [name, setName] = useState("");
  const [gameId, setGameId] = useState("");

  // Set preselected game when modal opens with preselectedGameId
  useEffect(() => {
    if (preselectedGameId && isOpen) {
      setGameId(preselectedGameId);
    }
  }, [preselectedGameId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !gameId) return;

    // If we have a returnTo (tournament flow), we need to create the rule set
    // and then navigate back with the new rule set ID to lock it in
    if (returnTo) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Create the rule set directly so we can get the ID
        const { data: newRuleSet, error } = await supabase
          .from("house_rule_sets")
          .insert({
            name: name.trim(),
            game_id: gameId,
            user_id: user.id,
            is_active: false,
          })
          .select()
          .single();

        if (error) throw error;

        // Extract tournament ID from returnTo URL
        const tournamentIdMatch = returnTo.match(/\/tournament\/([^?]+)/);
        const tournamentId = tournamentIdMatch ? tournamentIdMatch[1] : null;

        if (tournamentId && newRuleSet) {
          // Lock the rule set into the tournament
          const { error: updateError } = await supabase
            .from("tournaments")
            .update({ house_rule_set_id: newRuleSet.id })
            .eq("id", tournamentId);

          if (updateError) {
            console.error("Failed to lock rule set:", updateError);
            toast.error("Failed to lock rule set into tournament");
          } else {
            toast.success("Rule set created and locked into tournament!");
          }
        }

        setName("");
        setGameId("");
        onClose();
        
        // Navigate back to the tournament
        navigate(returnTo);
      } catch (error) {
        console.error("Failed to create rule set:", error);
        toast.error("Failed to create rule set");
      }
    } else {
      // Normal flow - create and navigate to the new rule set
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
    }
  };

  const handleClose = () => {
    setName("");
    setGameId("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Rule Set</DialogTitle>
          <DialogDescription>
            {returnTo 
              ? "Create a custom rule set to lock into your tournament"
              : "Create a custom set of house rules for any game"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="game">Game</Label>
            <Select value={gameId} onValueChange={setGameId} disabled={!!preselectedGameId}>
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
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !name.trim() || !gameId}>
              {returnTo ? "Create & Lock In" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
