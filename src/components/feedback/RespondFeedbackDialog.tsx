import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { CustomerFeedback } from '@/hooks/useFeedbackData';
import { FeedbackResponseSchema } from '@/lib/schemas/feedback';

interface Props {
  feedback: CustomerFeedback | null;
  responseText: string;
  setResponseText: (s: string) => void;
  onClose: () => void;
  onSubmit: () => Promise<void>;
}

export const RespondFeedbackDialog = ({ feedback, responseText, setResponseText, onClose, onSubmit }: Props) => {
  const handleSubmit = async () => {
    const parsed = FeedbackResponseSchema.safeParse({ response_text: responseText });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Respuesta inválida');
      return;
    }
    await onSubmit();
  };

  return (
    <Dialog open={!!feedback} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Responder a {feedback?.customer_name || 'Cliente'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm">{feedback?.comment}</p>
          </div>
          {feedback?.ai_response_suggestion && (
            <div className="p-3 border border-primary/20 rounded-lg bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Sugerencia IA</span>
              </div>
              <p className="text-sm">{feedback.ai_response_suggestion}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setResponseText(feedback.ai_response_suggestion || '')}
              >
                Usar sugerencia
              </Button>
            </div>
          )}
          <div className="grid gap-2">
            <Label>Tu Respuesta</Label>
            <Textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Escribe tu respuesta..."
              rows={4}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>Enviar Respuesta</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
