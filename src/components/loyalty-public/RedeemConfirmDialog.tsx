import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, Coins, Loader2, CheckCircle2 } from 'lucide-react';
import type { RewardItem, LoyaltyCustomer } from './loyaltyTypes';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  reward: RewardItem | null;
  customer: LoyaltyCustomer;
  redeeming: boolean;
  onConfirm: () => void;
}

export const RedeemConfirmDialog = ({ open, onOpenChange, reward, customer, redeeming, onConfirm }: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" />
          Confirmar Canje
        </DialogTitle>
        <DialogDescription>¿Estás seguro de canjear esta recompensa?</DialogDescription>
      </DialogHeader>
      {reward && (
        <div className="py-4">
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <h3 className="font-semibold text-lg">{reward.name}</h3>
            {reward.description && <p className="text-sm text-muted-foreground">{reward.description}</p>}
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">Puntos a usar:</span>
              <span className="font-bold text-primary flex items-center gap-1">
                <Coins className="w-4 h-4" />
                {reward.points_required.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Puntos restantes:</span>
              <span className="font-medium">{(customer.current_points - reward.points_required).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
      <DialogFooter className="flex-col gap-2 sm:flex-col">
        <Button onClick={onConfirm} disabled={redeeming} className="w-full">
          {redeeming ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Canjeando...</>) : (<><CheckCircle2 className="w-4 h-4 mr-2" />Confirmar Canje</>)}
        </Button>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={redeeming} className="w-full">Cancelar</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
