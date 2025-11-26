import { Crown, Zap, Users, Trophy, MessageSquare, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PremiumBadge } from "@/components/premium/PremiumBadge";
import { usePremium } from "@/hooks/usePremium";
import { useSubscription } from "@/hooks/useSubscription";
import { useState } from "react";
import { UpgradeModal } from "@/components/premium/UpgradeModal";

const features = [
  {
    icon: Lock,
    title: "Custom House Rules",
    description: "Create unlimited custom rule sets for any game. Save, share, and manage your own variations.",
    free: "View official rules only",
    premium: "Unlimited custom rule sets",
  },
  {
    icon: Trophy,
    title: "Multiple Tournaments",
    description: "Run multiple active tournaments per game simultaneously with full tracking and analytics.",
    free: "1 active tournament per game",
    premium: "Unlimited tournaments per game",
  },
  {
    icon: MessageSquare,
    title: "Full Voice Chat Features",
    description: "Access advanced voice commands for house rules creation, editing, and game result recording.",
    free: "Basic rule guidance only",
    premium: "Full voice features + commands",
  },
  {
    icon: Users,
    title: "Advanced Player Management",
    description: "Invite players via email, manage permissions, and track detailed player statistics.",
    free: "Basic player tracking",
    premium: "Advanced stats & invitations",
  },
  {
    icon: Zap,
    title: "Priority Support",
    description: "Get priority access to new features and faster response times for support requests.",
    free: "Community support",
    premium: "Priority email support",
  },
];

export default function PremiumFeatures() {
  const { hasPremiumAccess, isTrial, daysLeftInTrial } = usePremium();
  const { startCheckout, isCheckoutLoading } = useSubscription();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Crown className="h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold">Premium Features</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Unlock the full potential of your card game experience with premium features
        </p>
        
        {hasPremiumAccess ? (
          <div className="flex items-center justify-center gap-2">
            <PremiumBadge size="lg" />
            {isTrial && (
              <span className="text-sm text-muted-foreground">
                {daysLeftInTrial} days left in trial
              </span>
            )}
          </div>
        ) : (
          <Button 
            size="lg" 
            onClick={() => startCheckout()} 
            disabled={isCheckoutLoading}
            className="gap-2"
          >
            {isCheckoutLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Crown className="h-5 w-5" />
            )}
            {isCheckoutLoading ? "Loading..." : "Start 5-Day Free Trial"}
          </Button>
        )}
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {features.map((feature) => (
          <Card key={feature.title} className="relative overflow-hidden">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="mt-2">
                    {feature.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium">Free:</span>
                <span>{feature.free}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Crown className="h-4 w-4 text-primary" />
                <span className="font-medium">Premium:</span>
                <span className="text-primary">{feature.premium}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pricing */}
      <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Simple, Transparent Pricing</CardTitle>
          <CardDescription>
            Start with a 5-day free trial. Cancel anytime.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="space-y-2">
            <div className="text-5xl font-bold">$4.99</div>
            <div className="text-muted-foreground">per month</div>
          </div>
          
          {!hasPremiumAccess && (
            <Button size="lg" onClick={() => setIsUpgradeModalOpen(true)} className="gap-2">
              <Crown className="h-5 w-5" />
              Start Free Trial
            </Button>
          )}

          <p className="text-sm text-muted-foreground">
            No credit card required for trial • Cancel anytime
          </p>
        </CardContent>
      </Card>

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        feature="Premium Access"
      />
    </div>
  );
}