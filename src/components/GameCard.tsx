import { useNavigate } from "react-router-dom";
import { useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type GameCardVariant = 'default' | 'circular' | 'compact';

interface GameCardProps {
  id: string;
  title: string;
  image: string;
  variant?: GameCardVariant;
  // Default variant props
  players?: string;
  difficulty?: string;
  // Circular variant props
  onLongPress?: () => void;
  isDeleteMode?: boolean;
  shouldShake?: boolean;
  // Common remove functionality
  canRemove?: boolean;
  onRemove?: () => void;
}

/**
 * Unified GameCard component with three variants:
 * - default: Square card with image, title, players, difficulty badge
 * - circular: Circular avatar with long-press to delete, title below
 * - compact: Rectangular card with title overlay
 */
const GameCard = ({
  id,
  title,
  image,
  variant = 'default',
  players,
  difficulty,
  canRemove = false,
  onRemove,
  onLongPress,
  isDeleteMode = false,
  shouldShake = false,
}: GameCardProps) => {
  const navigate = useNavigate();
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    // In circular delete mode, clicking does nothing
    if (variant === 'circular' && isDeleteMode) {
      return;
    }
    navigate(`/game/${id}`);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  // Long press for circular variant
  const handlePressStart = () => {
    if (variant === 'circular' && canRemove && !isDeleteMode) {
      longPressTimer.current = setTimeout(() => {
        onLongPress?.();
      }, 2000);
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

  // Circular variant
  if (variant === 'circular') {
    return (
      <div className="flex flex-col items-center gap-2 w-[90px] pt-2">
        <div
          onClick={handleClick}
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          className={`group relative ${isDeleteMode ? 'cursor-move' : 'cursor-pointer'}`}
        >
          <div className={`w-20 h-20 rounded-full overflow-hidden border-2 border-border hover:border-primary transition-all duration-300 hover:scale-105 bg-card ${shouldShake ? 'animate-shake' : ''}`}>
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>

          {canRemove && isDeleteMode && (
            <button
              onClick={handleRemove}
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive hover:bg-destructive/90 flex items-center justify-center z-10 shadow-md animate-scale-in"
              aria-label={`Remove ${title}`}
            >
              <X className="h-3 w-3 text-destructive-foreground" />
            </button>
          )}
        </div>

        <span className="text-xs text-center text-foreground font-medium line-clamp-2 w-full">
          {title}
        </span>
      </div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
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
        
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 via-background/80 to-transparent p-3 pt-8">
          <h3 className="text-sm font-semibold text-foreground line-clamp-2">
            {title}
          </h3>
        </div>

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
  }

  // Default variant
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
          {difficulty && (
            <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              {difficulty}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GameCard;
