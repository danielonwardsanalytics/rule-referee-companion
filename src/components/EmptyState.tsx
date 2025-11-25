import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) => {
  return (
    <Card className="animate-fade-in">
      <CardContent className="py-12 text-center">
        <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-4 max-w-sm mx-auto">{description}</p>
        {actionLabel && onAction && (
          <Button onClick={onAction} className="hover-scale">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
