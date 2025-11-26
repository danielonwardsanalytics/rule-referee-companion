import { useState, useEffect } from "react";
import { Moon, Sun, Monitor, Crown, Calendar, QrCode, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePremium } from "@/hooks/usePremium";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/premium/UpgradeModal";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { NotificationPreferences } from "@/components/NotificationPreferences";
import { formatDistanceToNow } from "date-fns";

type Theme = "light" | "dark" | "system";

const Settings = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("theme") as Theme;
    return stored || "system";
  });
  const { premiumStatus, hasPremiumAccess, isTrial, isPremium, daysLeftInTrial } = usePremium();
  const { user } = useAuth();
  const { 
    openCustomerPortal, 
    isPortalLoading, 
    refreshSubscription,
    isLoading: isSubscriptionLoading 
  } = useSubscription();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.remove("light", "dark");
      root.classList.add(systemTheme);
    } else {
      root.classList.remove("light", "dark");
      root.classList.add(theme);
    }
    
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-background pb-20 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your app preferences</p>
        </div>

        {/* Premium Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Subscription
            </CardTitle>
            <CardDescription>
              Manage your premium subscription and billing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Badge */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-semibold text-lg">
                  {isPremium && "Premium"}
                  {isTrial && "Free Trial"}
                  {!hasPremiumAccess && "Free Plan"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {premiumStatus?.status?.toUpperCase() || 'FREE'}
                </p>
              </div>
              {isPremium ? (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                  <Crown className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              ) : isTrial ? (
                <Badge variant="secondary" className="gap-1">
                  <Calendar className="h-3 w-3" />
                  {daysLeftInTrial}d left
                </Badge>
              ) : (
                <Badge variant="outline">Free</Badge>
              )}
            </div>

            {/* Trial Warning */}
            {isTrial && premiumStatus?.trialEndsAt && (
              <div className="flex items-start gap-3 p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <Calendar className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    Trial ends {formatDistanceToNow(new Date(premiumStatus.trialEndsAt), { addSuffix: true })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upgrade now to keep unlimited tournaments, custom house rules, and voice features
                  </p>
                </div>
              </div>
            )}

            {/* Premium Features Summary */}
            {hasPremiumAccess && (
              <div className="space-y-2 pt-2">
                <p className="text-sm font-medium">Your Premium Benefits:</p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Unlimited custom house rules</li>
                  <li>• Multiple tournaments per game</li>
                  <li>• Full voice chat features</li>
                  <li>• Advanced player management</li>
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              {!isPremium && (
                <Button 
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="flex-1"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  {isTrial ? 'Upgrade Now' : 'Start Free Trial'}
                </Button>
              )}
              {isPremium && (
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => openCustomerPortal()}
                  disabled={isPortalLoading}
                >
                  {isPortalLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Manage Billing
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={() => refreshSubscription()}
                disabled={isSubscriptionLoading}
                title="Refresh subscription status"
              >
                {isSubscriptionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Crown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Choose how Fair Play looks on your device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={theme} onValueChange={(value) => setTheme(value as Theme)}>
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                <RadioGroupItem value="light" id="light" />
                <Label htmlFor="light" className="flex items-center gap-3 flex-1 cursor-pointer">
                  <div className="h-10 w-10 rounded-full bg-background border-2 border-border flex items-center justify-center">
                    <Sun className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <div className="font-medium">Light</div>
                    <div className="text-sm text-muted-foreground">Clean and bright</div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                <RadioGroupItem value="dark" id="dark" />
                <Label htmlFor="dark" className="flex items-center gap-3 flex-1 cursor-pointer">
                  <div className="h-10 w-10 rounded-full bg-background border-2 border-border flex items-center justify-center">
                    <Moon className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <div className="font-medium">Dark</div>
                    <div className="text-sm text-muted-foreground">Easy on the eyes</div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                <RadioGroupItem value="system" id="system" />
                <Label htmlFor="system" className="flex items-center gap-3 flex-1 cursor-pointer">
                  <div className="h-10 w-10 rounded-full bg-background border-2 border-border flex items-center justify-center">
                    <Monitor className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <div className="font-medium">System</div>
                    <div className="text-sm text-muted-foreground">Match device settings</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <NotificationPreferences />

        {/* QR Code */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Your QR Code
            </CardTitle>
            <CardDescription>
              Share your QR code to let friends add you quickly
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showQRCode ? (
              <div className="space-y-4">
                <QRCodeDisplay 
                  data={JSON.stringify({ type: "user", userId: user?.id })}
                  description="Others can scan this to add you as a friend"
                />
                <Button 
                  variant="outline" 
                  onClick={() => setShowQRCode(false)}
                  className="w-full"
                >
                  Hide QR Code
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => setShowQRCode(true)}
                className="w-full hover-scale"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Show My QR Code
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </div>
  );
};

export default Settings;
