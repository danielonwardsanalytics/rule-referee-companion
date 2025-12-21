import { useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowLeft, Send, Loader2, ChevronDown, ChevronUp, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useBetaFeedback, FEEDBACK_CATEGORIES, FeedbackCategory } from "@/hooks/useBetaFeedback";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface BetaFeedbackPopoverProps {
  onClose: () => void;
}

export const BetaFeedbackPopover = ({ onClose }: BetaFeedbackPopoverProps) => {
  const [step, setStep] = useState<'category' | 'text' | 'success'>('category');
  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [showExplanations, setShowExplanations] = useState(false);
  
  const location = useLocation();
  const { submitFeedback } = useBetaFeedback();

  const handleCategorySelect = (category: FeedbackCategory) => {
    setSelectedCategory(category);
    setStep('text');
  };

  const handleSubmit = async () => {
    if (!selectedCategory || !feedbackText.trim()) return;

    await submitFeedback.mutateAsync({
      category: selectedCategory,
      feedback_text: feedbackText.trim(),
      page_url: location.pathname,
    });

    setStep('success');
    setTimeout(() => {
      onClose();
      // Reset state after close
      setStep('category');
      setSelectedCategory(null);
      setFeedbackText("");
    }, 1500);
  };

  const handleBack = () => {
    setStep('category');
    setSelectedCategory(null);
  };

  const selectedCategoryData = FEEDBACK_CATEGORIES.find(c => c.value === selectedCategory);

  return (
    <div className="p-4">
      <AnimatePresence mode="wait">
        {step === 'category' && (
          <motion.div
            key="category"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
          >
            <h3 className="text-sm font-semibold text-foreground mb-3">
              What's your feedback about?
            </h3>
            
            <div className="grid grid-cols-3 gap-2 mb-3">
              {FEEDBACK_CATEGORIES.map((category) => (
                <button
                  key={category.value}
                  onClick={() => handleCategorySelect(category.value)}
                  className={cn(
                    "flex flex-col items-center justify-center",
                    "p-2 rounded-lg border border-border/50",
                    "bg-background hover:bg-accent/50",
                    "transition-all duration-150",
                    "hover:border-primary/50 hover:shadow-sm",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                    "text-center"
                  )}
                >
                  <span className="text-lg mb-1">{category.emoji}</span>
                  <span className="text-[10px] font-medium text-foreground/80 leading-tight">
                    {category.label}
                  </span>
                </button>
              ))}
            </div>

            <Collapsible open={showExplanations} onOpenChange={setShowExplanations}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                >
                  {showExplanations ? (
                    <>
                      <ChevronUp className="w-3 h-3 mr-1" />
                      Hide explanations
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 mr-1" />
                      Explain categories
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto text-xs">
                  {FEEDBACK_CATEGORIES.map((category) => (
                    <div key={category.value} className="flex gap-2 p-2 rounded bg-muted/50">
                      <span>{category.emoji}</span>
                      <div>
                        <span className="font-medium text-foreground">{category.label}:</span>
                        <span className="text-muted-foreground ml-1">{category.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </motion.div>
        )}

        {step === 'text' && (
          <motion.div
            key="text"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleBack}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-muted text-sm">
                <span>{selectedCategoryData?.emoji}</span>
                <span className="font-medium">{selectedCategoryData?.label}</span>
              </div>
            </div>

            <Textarea
              placeholder="Tell us more..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="min-h-[100px] resize-none mb-3"
              autoFocus
            />

            <Button
              onClick={handleSubmit}
              disabled={!feedbackText.trim() || submitFeedback.isPending}
              className="w-full"
            >
              {submitFeedback.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Feedback
                </>
              )}
            </Button>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center justify-center py-6"
          >
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-3">
              <Check className="w-6 h-6 text-green-500" />
            </div>
            <p className="font-medium text-foreground">Thanks!</p>
            <p className="text-sm text-muted-foreground">Your feedback helps us improve</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
