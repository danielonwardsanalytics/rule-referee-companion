import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface GameCardCircularProps {
  id: string;
  title: string;
  image: string;
  canRemove?: boolean;
  onRemove?: () => void;
  onDeleteModeChange?: (isActive: boolean) => void;
  shouldShake?: boolean;
}

const GameCardCircular = ({
  id,
  title,
  image,
  canRemove = false,
  onRemove,
  onDeleteModeChange,
  shouldShake = false,
}: GameCardCircularProps) => {
  const navigate = useNavigate();
  const [showRemove, setShowRemove] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleClick = () => {
    if (!showRemove) {
      navigate(`/game/${id}`);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove();
      setShowRemove(false);
      if (onDeleteModeChange) {
        onDeleteModeChange(false);
      }
    }
  };

  const handlePressStart = () => {
    if (canRemove) {
      longPressTimer.current = setTimeout(() => {
        setShowRemove(true);
        if (onDeleteModeChange) {
          onDeleteModeChange(true);
        }
      }, 2000); // 2 seconds
    }
  };

  const handlePressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-2 w-[80px]">
      <div
        onClick={handleClick}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        className="group relative cursor-pointer"
      >
        {/* Circular image container */}
        <div className={`w-16 h-16 rounded-full overflow-hidden border-2 border-border hover:border-primary transition-all duration-300 hover:scale-105 bg-card ${shouldShake ? 'animate-shake' : ''}`}>
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Remove button - only shows after 2 second hold */}
        {canRemove && showRemove && (
          <button
            onClick={handleRemove}
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive hover:bg-destructive/90 flex items-center justify-center z-10 shadow-md animate-scale-in"
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
