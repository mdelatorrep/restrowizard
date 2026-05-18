import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PartyPopper } from 'lucide-react';
import type { RewardItem } from './loyaltyTypes';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  reward: RewardItem | null;
  result: { code: string; expiresAt: string } | null;
  onClose: () => void;
}

export const RedeemSuccessDialog = ({ open, onOpenChange, reward, result, onClose }: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-sm">
      <div className="text-center py-4">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
          <PartyPopper className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">¡Felicidades!</h2>
        <p className="text-muted-foreground mb-4">Has canjeado exitosamente tu recompensa</p>
        {reward && (
          <div className="p-4 bg-muted rounded-lg mb-4"><p className="font-semibold">{reward.name}</p></div>
        )}
        {result && (
          <div className="space-y-3">
            <div className="p-4 bg-primary/10 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Tu código de canje</p>
              <p className="text-2xl font-mono font-bold text-primary tracking-wider">{result.code}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Válido hasta el {new Date(result.expiresAt).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p className="text-sm text-muted-foreground">Muestra este código al momento de tu compra</p>
          </div>
        )}
        <Button className="w-full mt-6" onClick={onClose}>Entendido</Button>
      </div>
    </DialogContent>
  </Dialog>
);
