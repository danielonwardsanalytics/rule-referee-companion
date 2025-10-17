import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface GameCardProps {
  id: string;
  title: string;
  image: string;
  players: string;
  difficulty: string;
}

const GameCard = ({ id, title, image, players, difficulty }: GameCardProps) => {
  const navigate = useNavigate();

  return (
    <Card 
      className="group cursor-pointer overflow-hidden border-border bg-gradient-to-b from-card to-card/50 shadow-[var(--shadow-soft)] transition-all duration-300 hover:shadow-[var(--shadow-card)] hover:-translate-y-1"
      onClick={() => navigate(`/game/${id}`)}
    >
      <div className="aspect-square overflow-hidden">
        <img 
          src={image} 
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-bold text-lg text-foreground mb-2">{title}</h3>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{players}</span>
          <span className="px-2 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
            {difficulty}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default GameCard;
