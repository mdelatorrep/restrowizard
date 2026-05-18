import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ConnectAccountSchema } from '@/lib/schemas/socialMention';
import { PLATFORM_OPTIONS } from './socialConfig';

interface Props {
  onConnect: (payload: any) => Promise<any>;
}

const initial = { platform: 'google', account_name: '', account_url: '' };

export const ConnectAccountDialog: React.FC<Props> = ({ onConnect }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initial);

  const handleSubmit = async () => {
    const parsed = ConnectAccountSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Datos inválidos');
      return;
    }
    await onConnect(parsed.data);
    setOpen(false);
    setForm(initial);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Globe className="h-4 w-4 mr-2" />
          Conectar Cuenta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conectar Cuenta de Redes</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Plataforma</Label>
            <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLATFORM_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Nombre de la Cuenta</Label>
            <Input
              value={form.account_name}
              onChange={(e) => setForm({ ...form, account_name: e.target.value })}
              placeholder="@turestaurante"
            />
          </div>
          <div className="grid gap-2">
            <Label>URL del Perfil</Label>
            <Input
              value={form.account_url}
              onChange={(e) => setForm({ ...form, account_url: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit}>Conectar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
