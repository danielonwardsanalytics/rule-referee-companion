import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AskQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameName?: string;
}

const AskQuestionModal = ({ isOpen, onClose, gameName }: AskQuestionModalProps) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) {
      toast.error("Please enter a question");
      return;
    }

    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setAnswer(
      `Based on the official ${gameName || "game"} rules: ${question.includes("draw") ? "You must draw until you have a playable card, then you may play it or end your turn." : "Please consult the official rulebook for this specific scenario. Generally, follow the most recent official rules unless your group has agreed on house rules."}`
    );
    setIsLoading(false);
  };

  const handleClose = () => {
    setQuestion("");
    setAnswer("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <MessageSquare className="h-5 w-5" />
            Ask About {gameName || "the Rules"}
          </DialogTitle>
          <DialogDescription>
            Type your question and we'll provide an official ruling to settle any disputes.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Your Question
            </label>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., What happens if I can't play any cards?"
              className="min-h-[100px] resize-none"
            />
          </div>

          {answer && (
            <div className="p-4 rounded-lg bg-secondary/50 border border-border animate-fade-in">
              <h4 className="font-semibold text-foreground mb-2">Official Ruling:</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
            <Button 
              onClick={handleAsk} 
              disabled={isLoading}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking Rules...
                </>
              ) : (
                "Get Answer"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AskQuestionModal;
