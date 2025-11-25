import { ReactNode, useState } from "react";
import { usePremium } from "@/hooks/usePremium";
import { Button } from "@/components/ui/button";
import { Crown, Loader2 } from "lucide-react";
import { UpgradeModal } from "./UpgradeModal";

interface PremiumGateProps {
  children: ReactNode;
  feature: string;
  fallback?: ReactNode;
}

export const PremiumGate = ({ children, feature, fallback }: PremiumGateProps) => {
  const { hasPremiumAccess, isLoading } = usePremium();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasPremiumAccess) {
    return (
      <>
        {fallback || (
          <div className="text-center p-8 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5">
            <Crown className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-bold mb-2">Premium Feature</h3>
            <p className="text-muted-foreground mb-4">
              {feature} is a premium feature. Upgrade to unlock this and more!
            </p>
            <Button onClick={() => setIsUpgradeModalOpen(true)}>
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Premium
            </Button>
          </div>
        )}
        <UpgradeModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          feature={feature}
        />
      </>
    );
  }

  return <>{children}</>;
};
