import { Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PremiumBadgeProps {
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export const PremiumBadge = ({ size = "md", showIcon = true }: PremiumBadgeProps) => {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };

  return (
    <Badge
      variant="secondary"
      className={`${sizeClasses[size]} bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 font-semibold`}
    >
      {showIcon && <Crown className={`${iconSizes[size]} mr-1`} />}
      PREMIUM
    </Badge>
  );
};
