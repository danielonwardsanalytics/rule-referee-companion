import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

interface GameCardCompactProps {
  id: string;
  title: string;
  image: string;
  canRemove?: boolean;
  onRemove?: () => void;
}

const GameCardCompact = ({
  id,
  title,
  image,
  canRemove = false,
  onRemove,
}: GameCardCompactProps) => {
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
    <div
      onClick={handleClick}
      className="group relative w-[140px] h-[180px] cursor-pointer rounded-lg overflow-hidden border border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-lg"
    >
      <img
        src={image}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
      />
      
      {/* Title overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 via-background/80 to-transparent p-3 pt-8">
        <h3 className="text-sm font-semibold text-foreground line-clamp-2">
          {title}
        </h3>
      </div>

      {/* Remove button */}
      {canRemove && (
        <button
          onClick={handleRemove}
          className="absolute top-2 right-2 h-6 w-6 rounded-full bg-destructive/90 hover:bg-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
          aria-label={`Remove ${title}`}
        >
          <X className="h-3 w-3 text-destructive-foreground" />
        </button>
      )}
    </div>
  );
};

export default GameCardCompact;
