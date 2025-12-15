import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";

interface ActionConfirmationProps {
  onConfirm: () => void;
  onCancel: () => void;
  isExecuting: boolean;
}

export const ActionConfirmation = ({ onConfirm, onCancel, isExecuting }: ActionConfirmationProps) => {
  return (
    <div className="flex items-center gap-3 mt-3 p-3 bg-primary/10 border border-primary/20 rounded-lg animate-in slide-in-from-bottom-2">
      <span className="text-sm text-muted-foreground flex-1">
        Say "yes" to confirm or use the buttons:
      </span>
      <Button
        size="sm"
        variant="outline"
        onClick={onCancel}
        disabled={isExecuting}
        className="border-destructive/50 text-destructive hover:bg-destructive/10"
      >
        <X className="h-4 w-4 mr-1" />
        Cancel
      </Button>
      <Button
        size="sm"
        onClick={onConfirm}
        disabled={isExecuting}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        {isExecuting ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <Check className="h-4 w-4 mr-1" />
        )}
        Implement
      </Button>
    </div>
  );
};
