import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Gift, Coins, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { rewardTypeLabels } from './loyaltyConstants';
import type { RewardItem, LoyaltyCustomer } from './loyaltyTypes';

interface Props {
  rewards: RewardItem[];
  customer: LoyaltyCustomer;
  onRedeem: (r: RewardItem) => void;
}

export const LoyaltyRewardsTab = ({ rewards, customer, onRedeem }: Props) => (
  <div className="space-y-3 mt-4">
    {rewards.length === 0 ? (
      <Card><CardContent className="p-6 text-center">
        <Gift className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground">No hay recompensas disponibles ahora</p>
      </CardContent></Card>
    ) : rewards.map(reward => {
      const canRedeem = customer.current_points >= reward.points_required;
      return (
        <Card key={reward.id} className={cn('transition-all', !canRedeem && 'opacity-60')}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{reward.name}</h3>
                  <Badge variant="secondary" className="text-xs">{rewardTypeLabels[reward.reward_type]}</Badge>
                </div>
                {reward.description && <p className="text-sm text-muted-foreground mb-2">{reward.description}</p>}
                <div className="flex items-center gap-1 text-primary font-bold">
                  <Coins className="w-4 h-4" />
                  {reward.points_required.toLocaleString()} pts
                </div>
              </div>
              <Button size="sm" disabled={!canRedeem} className="ml-3" onClick={() => canRedeem && onRedeem(reward)}>
                {canRedeem ? 'Canjear' : (
                  <span className="flex items-center gap-1">
                    <ArrowUp className="w-3 h-3" />
                    {(reward.points_required - customer.current_points).toLocaleString()}
                  </span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    })}
  </div>
);
