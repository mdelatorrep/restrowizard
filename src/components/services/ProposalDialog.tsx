import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCreateProposal } from '@/hooks/useServiceMarketplace';
import { ProposalSchema } from '@/lib/schemas/proposal';
import { toast } from 'sonner';

interface ProposalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  providerId: string;
}

const ProposalDialog = ({ open, onOpenChange, requestId, providerId }: ProposalDialogProps) => {
  const [message, setMessage] = useState('');
  const [price, setPrice] = useState('');
  const [days, setDays] = useState('');
  const createProposal = useCreateProposal();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = ProposalSchema.safeParse({
      request_id: requestId,
      provider_id: providerId,
      message,
      price: price ? parseFloat(price) : undefined,
      estimated_delivery_days: days ? parseInt(days) : undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Revisa los campos');
      return;
    }
    createProposal.mutate(parsed.data, {
      onSuccess: () => {
        onOpenChange(false);
        setMessage(''); setPrice(''); setDays('');
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar Propuesta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tu propuesta *</Label>
            <Textarea value={message} onChange={e => setMessage(e.target.value)} required rows={4}
              placeholder="Describe tu propuesta, experiencia relevante y por qué eres la mejor opción..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Precio propuesto (COP)</Label>
              <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="500000" />
            </div>
            <div className="space-y-2">
              <Label>Días de entrega</Label>
              <Input type="number" value={days} onChange={e => setDays(e.target.value)} placeholder="7" />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={createProposal.isPending}>
            {createProposal.isPending ? 'Enviando...' : 'Enviar Propuesta'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProposalDialog;
