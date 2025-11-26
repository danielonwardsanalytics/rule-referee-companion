import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Check, Loader2 } from "lucide-react";
import { usePremium } from "@/hooks/usePremium";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

export const UpgradeModal = ({ isOpen, onClose, feature }: UpgradeModalProps) => {
  const { isTrial, daysLeftInTrial } = usePremium();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success("Opening checkout in new tab...");
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const premiumFeatures = [
    "Create unlimited custom house rules",
    "Multiple active tournaments per game",
    "Full voice chat AI assistant",
    "Advanced tournament management",
    "Public house rules sharing",
    "Priority support",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-6 w-6 text-primary" />
            <DialogTitle className="text-2xl">Upgrade to Premium</DialogTitle>
          </div>
          {feature && (
            <DialogDescription className="text-base">
              Unlock <span className="font-semibold">{feature}</span> and all premium
              features
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isTrial && (
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm font-medium text-center">
                🎉 You have {daysLeftInTrial} {daysLeftInTrial === 1 ? 'day' : 'days'} left in your free trial!
              </p>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Premium includes:</h3>
            {premiumFeatures.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 space-y-3">
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleUpgrade}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Crown className="h-4 w-4 mr-2" />
              )}
              {isLoading ? "Loading..." : "Upgrade Now - $9.99/month"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Cancel anytime. No commitments.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
