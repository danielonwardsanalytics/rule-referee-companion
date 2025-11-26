import { usePremium } from "@/hooks/usePremium";
import { Button } from "@/components/ui/button";
import { Crown, X, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const TrialBanner = () => {
  const { isTrial, daysLeftInTrial } = usePremium();
  const [isDismissed, setIsDismissed] = useState(false);
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

  if (!isTrial || isDismissed || daysLeftInTrial <= 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Crown className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">
            {daysLeftInTrial === 1 
              ? `Last day of your free trial! Upgrade to keep premium features.`
              : `${daysLeftInTrial} days left in your free trial`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="bg-white text-orange-600 hover:bg-white/90"
            onClick={handleUpgrade}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            {isLoading ? "Loading..." : "Upgrade Now"}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-white hover:bg-white/20 h-8 w-8"
            onClick={() => setIsDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
