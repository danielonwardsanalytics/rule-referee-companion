import { X, GamepadIcon, FileText, Trophy, Globe, Users, Target, Settings, User, LogOut, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePremium } from "@/hooks/usePremium";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PremiumBadge } from "./premium/PremiumBadge";

interface MenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MenuOverlay = ({ isOpen, onClose }: MenuOverlayProps) => {
  const { signOut, user } = useAuth();
  const { premiumStatus, isPremium, isTrial, daysLeftInTrial } = usePremium();

  const menuItems = [
    { icon: GamepadIcon, label: "All Games", path: "/games" },
    { icon: FileText, label: "My House Rules", path: "/my-house-rules" },
    { icon: Trophy, label: "Tournaments", path: "/tournaments" },
    { icon: Globe, label: "Public House Rules", path: "/public-house-rules" },
    { icon: Users, label: "Friends", path: "/friends" },
    { icon: Target, label: "Game Requests", path: "/game-requests" },
  ];

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-bold">Menu</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-muted transition-colors"
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}

            <Separator className="my-4" />

            <Link
              to="/settings"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-muted transition-colors"
            >
              <Settings className="h-5 w-5" />
              <span className="font-medium">Settings</span>
            </Link>

            <Link
              to="/profile"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-muted transition-colors"
            >
              <User className="h-5 w-5" />
              <span className="font-medium">Profile</span>
            </Link>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Logout</span>
            </button>
          </nav>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  {isPremium ? (
                    <PremiumBadge size="sm" />
                  ) : isTrial ? (
                    <p className="text-xs text-muted-foreground">
                      Trial: {daysLeftInTrial} {daysLeftInTrial === 1 ? 'day' : 'days'} left
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Free Plan</p>
                  )}
                </div>
              </div>
              {!isPremium && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={onClose}
                  asChild
                >
                  <Link to="/settings">
                    <Crown className="h-3 w-3 mr-1" />
                    Upgrade
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
