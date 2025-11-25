import { Home, BookOpen, Trophy, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  onMenuClick: () => void;
}

export const BottomNav = ({ onMenuClick }: BottomNavProps) => {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Hub", path: "/" },
    { icon: BookOpen, label: "Rules", path: "/rules" },
    { icon: Trophy, label: "Tournaments", path: "/tournaments" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors min-w-[64px]",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}

          <button
            onClick={onMenuClick}
            className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-muted min-w-[64px]"
          >
            <Menu className="h-5 w-5" />
            <span className="text-xs font-medium">Menu</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
