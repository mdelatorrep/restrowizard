import { Badge } from '@/components/ui/badge';
import { Star, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';

export const SentimentBadge = ({ label }: { label: string | null }) => {
  if (!label) return null;
  const config = {
    positive: { icon: ThumbsUp, color: 'bg-green-100 text-green-800' },
    negative: { icon: ThumbsDown, color: 'bg-red-100 text-red-800' },
    neutral: { icon: Minus, color: 'bg-gray-100 text-gray-800' },
  };
  const { icon: Icon, color } = config[label as keyof typeof config] || config.neutral;
  return (
    <Badge className={color}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
};

export const StarRating = ({ rating }: { rating: number | null }) => {
  if (!rating) return <span className="text-muted-foreground">Sin calificación</span>;
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
};
