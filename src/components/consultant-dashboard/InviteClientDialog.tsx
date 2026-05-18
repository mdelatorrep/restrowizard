import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Link2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Props {
  inviteLink: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function InviteClientDialog({ inviteLink, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast({ title: 'Link copiado', description: 'El link de invitación ha sido copiado al portapapeles' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Invitar Cliente
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Invitar Nuevo Cliente
          </DialogTitle>
          <DialogDescription>
            Comparte este enlace con tu cliente para que se registre y quede vinculado automáticamente a tu consultoría.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input value={inviteLink} readOnly className="flex-1 font-mono text-sm" />
            <Button onClick={copy} variant="outline">
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">¿Cómo funciona?</h4>
            <ol className="text-sm text-muted-foreground space-y-1">
              <li>1. Copia el link de invitación</li>
              <li>2. Envíalo a tu cliente por email o WhatsApp</li>
              <li>3. El cliente se registra usando el link</li>
              <li>4. Automáticamente aparecerá en tu lista de clientes</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
