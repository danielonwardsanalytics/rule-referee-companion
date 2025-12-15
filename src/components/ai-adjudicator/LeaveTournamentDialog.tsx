import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useActiveContext } from "@/hooks/useActiveContext";

interface LeaveTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentName: string;
}

export const LeaveTournamentDialog = ({
  open,
  onOpenChange,
  tournamentName,
}: LeaveTournamentDialogProps) => {
  const navigate = useNavigate();
  const { clearActiveTournament } = useActiveContext();

  const handleLeaveTournament = () => {
    clearActiveTournament();
    onOpenChange(false);
    navigate("/house-rules");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave Tournament to Change Rules?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              You're currently in the <strong>"{tournamentName}"</strong> tournament which has locked house rules.
            </p>
            <p>
              To change your active rule set, you need to leave this tournament first.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleLeaveTournament}>
            Leave Tournament
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
