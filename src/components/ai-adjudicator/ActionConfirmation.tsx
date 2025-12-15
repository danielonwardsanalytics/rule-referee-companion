import { Button } from "@/components/ui/button";
import { Check, X, Loader2, Sparkles } from "lucide-react";

interface ActionConfirmationProps {
  onConfirm: () => void;
  onCancel: () => void;
  isExecuting: boolean;
  confirmationMessage?: string;
}

export const ActionConfirmation = ({ onConfirm, onCancel, isExecuting, confirmationMessage }: ActionConfirmationProps) => {
  console.log("[ActionConfirmation] Rendering with isExecuting:", isExecuting, "message:", confirmationMessage);
  
  return (
    <div className="my-4 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-xl animate-in slide-in-from-bottom-2 shadow-lg shadow-green-500/20">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5 text-green-400 animate-pulse" />
        <span className="font-semibold text-green-300">Action Ready to Execute</span>
      </div>
      
      {confirmationMessage && (
        <p className="text-sm text-foreground/80 mb-4 bg-background/30 p-2 rounded">
          {confirmationMessage}
        </p>
      )}
      
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="default"
          onClick={onCancel}
          disabled={isExecuting}
          className="flex-1 gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
        >
          <X className="h-4 w-4" />
          Cancel
        </Button>
        <Button
          size="default"
          onClick={onConfirm}
          disabled={isExecuting}
          className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold"
        >
          {isExecuting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {isExecuting ? "Creating..." : "Implement"}
        </Button>
      </div>
    </div>
  );
};