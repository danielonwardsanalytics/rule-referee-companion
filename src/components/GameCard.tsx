import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface GameCardProps {
  id: string;
  title: string;
  image: string;
  players: string;
  difficulty: string;
  canRemove?: boolean;
  onRemove?: () => void;
}

const GameCard = ({ id, title, image, players, difficulty, canRemove, onRemove }: GameCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/game/${id}`);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <Card 
      className="group cursor-pointer overflow-hidden border-border bg-gradient-to-b from-card to-card/50 shadow-[var(--shadow-soft)] hover-lift animate-slide-up relative"
      onClick={handleClick}
      style={{ animationDelay: `${Math.random() * 0.1}s` }}
    >
      {canRemove && (
        <button
          onClick={handleRemove}
          className="absolute top-2 right-2 z-10 bg-destructive text-destructive-foreground rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 button-press"
          aria-label="Remove game"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
          </svg>
        </button>
      )}
      <div className="aspect-square overflow-hidden relative">
        {image ? (
          <>
            <img 
              src={image} 
              alt={title}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </>
        ) : (
          <div className="h-full w-full bg-muted flex items-center justify-center">
            <span className="text-4xl font-bold text-muted-foreground">{title.charAt(0)}</span>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-bold text-lg text-foreground mb-2 line-clamp-1">{title}</h3>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="text-xs">{players}</span>
          <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            {difficulty}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default GameCard;
