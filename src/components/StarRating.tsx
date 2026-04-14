import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md';
  readonly?: boolean;
}

export const StarRating = ({ rating, onChange, size = 'md', readonly = false }: StarRatingProps) => {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          aria-label={readonly ? `${rating} star rating` : `Rate ${star} star${star === 1 ? '' : 's'}`}
          onClick={() => onChange?.(star)}
          className={cn(
            'transition-colors',
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110',
          )}
        >
          <Star
            className={cn(
              iconSize,
              star <= rating
                ? 'fill-amber-400 text-amber-400'
                : 'text-muted-foreground/30',
            )}
          />
        </button>
      ))}
    </div>
  );
};

export const RatingDisplay = ({ rating, count }: { rating: number; count: number }) => {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-1">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      <span className="text-xs font-medium">{rating.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">({count})</span>
    </div>
  );
};
