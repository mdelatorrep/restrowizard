import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Copy } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: any;
  setClient: (c: any) => void;
  getInvitationLink: (c: any) => string | null | undefined;
  onCopyInvite: (c: any) => void;
  onSend: () => void;
}

export const SendInvitationDialog: React.FC<Props> = ({
  open, onOpenChange, client, setClient, getInvitationLink, onCopyInvite, onSend,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Enviar Invitación</DialogTitle>
        <DialogDescription>
          Envía una invitación al restaurante para que se vincule a tu cuenta
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Email del restaurante</Label>
          <Input
            type="email"
            placeholder="contacto@restaurante.com"
            value={client?.restaurant_email || ''}
            onChange={(e) => setClient(client ? { ...client, restaurant_email: e.target.value } : null)}
          />
        </div>
        {client && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Link de invitación:</p>
            <div className="flex items-center gap-2">
              <code className="text-xs flex-1 truncate">{getInvitationLink(client)}</code>
              <Button size="sm" variant="ghost" onClick={() => onCopyInvite(client)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
        <Button onClick={onSend} disabled={!client?.restaurant_email}>
          <Mail className="h-4 w-4 mr-2" />
          Enviar Invitación
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
