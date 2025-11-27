import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

interface GameCardCircularProps {
  id: string;
  title: string;
  image: string;
  canRemove?: boolean;
  onRemove?: () => void;
}

const GameCardCircular = ({
  id,
  title,
  image,
  canRemove = false,
  onRemove,
}: GameCardCircularProps) => {
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
    <div className="flex flex-col items-center gap-2 w-[80px]">
      <div
        onClick={handleClick}
        className="group relative cursor-pointer"
      >
        {/* Circular image container */}
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border hover:border-primary transition-all duration-300 hover:scale-105 bg-card">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Remove button */}
        {canRemove && (
          <button
            onClick={handleRemove}
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive hover:bg-destructive/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 shadow-md"
            aria-label={`Remove ${title}`}
          >
            <X className="h-3 w-3 text-destructive-foreground" />
          </button>
        )}
      </div>

      {/* Title below circle */}
      <span className="text-xs text-center text-foreground font-medium line-clamp-2 w-full">
        {title}
      </span>
    </div>
  );
};

export default GameCardCircular;
