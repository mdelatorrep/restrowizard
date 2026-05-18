import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { statusLabels } from './loyaltyConstants';
import type { RedeemedReward } from './loyaltyTypes';

export const LoyaltyMyRewardsTab = ({ rewards }: { rewards: RedeemedReward[] }) => (
  <div className="space-y-3 mt-4">
    {rewards.length === 0 ? (
      <Card><CardContent className="p-6 text-center">
        <Star className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground">No has canjeado premios aún</p>
      </CardContent></Card>
    ) : rewards.map(reward => {
      const status = statusLabels[reward.status] || statusLabels.pending;
      return (
        <Card key={reward.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{reward.reward?.name || 'Recompensa'}</h3>
                <p className="text-sm text-muted-foreground">
                  {reward.redeemed_at && new Date(reward.redeemed_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                {reward.redemption_code && reward.status === 'pending' && (
                  <div className="mt-2 p-2 bg-primary/10 rounded text-center">
                    <p className="text-xs text-muted-foreground">Código de canje</p>
                    <p className="font-mono font-bold text-primary">{reward.redemption_code}</p>
                  </div>
                )}
              </div>
              <Badge variant="outline" className={cn('flex items-center gap-1', status.color)}>
                {status.icon}{status.label}
              </Badge>
            </div>
          </CardContent>
        </Card>
      );
    })}
  </div>
);
