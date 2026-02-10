import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { useCreateReview } from '@/hooks/useProviderProfile';

const RatingStars = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
  <div className="space-y-1">
    <Label className="text-xs">{label}</Label>
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} type="button" onClick={() => onChange(s)}
          className="transition-colors">
          <Star className={`h-5 w-5 ${s <= value ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
        </button>
      ))}
    </div>
  </div>
);

interface ReviewFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
  requestId?: string;
}

const ReviewForm = ({ open, onOpenChange, providerId, requestId }: ReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [quality, setQuality] = useState(0);
  const [punctuality, setPunctuality] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [comment, setComment] = useState('');
  const createReview = useCreateReview();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    createReview.mutate({
      provider_id: providerId,
      request_id: requestId,
      rating,
      quality_rating: quality || undefined,
      punctuality_rating: punctuality || undefined,
      communication_rating: communication || undefined,
      comment: comment || undefined,
    }, {
      onSuccess: () => { onOpenChange(false); setRating(0); setQuality(0); setPunctuality(0); setCommunication(0); setComment(''); },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Calificar Proveedor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <RatingStars value={rating} onChange={setRating} label="Calificación general *" />
          <div className="grid grid-cols-3 gap-3">
            <RatingStars value={quality} onChange={setQuality} label="Calidad" />
            <RatingStars value={punctuality} onChange={setPunctuality} label="Puntualidad" />
            <RatingStars value={communication} onChange={setCommunication} label="Comunicación" />
          </div>
          <div className="space-y-2">
            <Label>Comentario</Label>
            <Textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
              placeholder="Comparte tu experiencia con este proveedor..." />
          </div>
          <Button type="submit" className="w-full" disabled={createReview.isPending || rating === 0}>
            {createReview.isPending ? 'Enviando...' : 'Publicar Reseña'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewForm;
