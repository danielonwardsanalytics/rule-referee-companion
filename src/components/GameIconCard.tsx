import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface GameIconCardProps {
  icon: LucideIcon;
  title: string;
  onClick: () => void;
}

const GameIconCard = ({ icon: Icon, title, onClick }: GameIconCardProps) => {
  return (
    <Card
      className="p-6 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all border-border bg-card group"
      onClick={onClick}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Icon className="w-10 h-10 text-white" />
        </div>
        <h3 className="font-semibold text-center text-foreground">{title}</h3>
      </div>
    </Card>
  );
};

export default GameIconCard;
