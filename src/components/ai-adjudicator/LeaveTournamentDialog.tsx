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
  const { clearActiveTournament } = useActiveContext();

  const handleTurnOffTournament = () => {
    clearActiveTournament();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Turn Off Tournament to Change Rule Set</AlertDialogTitle>
          <AlertDialogDescription>
            You're currently in the <strong>"{tournamentName}"</strong> tournament. 
            Turn off the tournament first to change your rule set.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleTurnOffTournament}>
            Turn Off Tournament
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
