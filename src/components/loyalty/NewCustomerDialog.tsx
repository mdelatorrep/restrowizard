import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoyaltyCustomerSchema } from '@/lib/schemas/loyalty';
import { toast } from 'sonner';

interface CustomerForm { customer_name: string; customer_email: string; customer_phone: string; }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: CustomerForm;
  onChange: (v: CustomerForm) => void;
  onSubmit: () => void | Promise<void>;
}

export const NewCustomerDialog = ({ open, onOpenChange, value, onChange, onSubmit }: Props) => {
  const handleSubmit = async () => {
    const parsed = LoyaltyCustomerSchema.safeParse(value);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Revisa los campos');
      return;
    }
    await onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Cliente</DialogTitle>
          <DialogDescription>Añade un nuevo miembro al programa de fidelización</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nombre *</Label>
            <Input value={value.customer_name} onChange={(e) => onChange({ ...value, customer_name: e.target.value })} placeholder="Nombre del cliente" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={value.customer_email} onChange={(e) => onChange({ ...value, customer_email: e.target.value })} placeholder="cliente@email.com" />
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input value={value.customer_phone} onChange={(e) => onChange({ ...value, customer_phone: e.target.value })} placeholder="+1 234 567 8900" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!value.customer_name}>Registrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
