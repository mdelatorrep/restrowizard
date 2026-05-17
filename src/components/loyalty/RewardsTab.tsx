import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus, Gift } from 'lucide-react';
import { RewardCard } from '@/components/loyalty/LoyaltyCards';
import type { RewardsCatalogItem } from '@/hooks/useLoyaltyData';

interface RewardsTabProps {
  catalog: RewardsCatalogItem[];
  onNewReward: () => void;
}

export const RewardsTab = ({ catalog, onNewReward }: RewardsTabProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onNewReward}>
          <Plus className="w-4 h-4 mr-2" /> Nueva Recompensa
        </Button>
      </div>

      {catalog.length === 0 ? (
        <EmptyState
          icon={<Gift className="w-12 h-12" />}
          title="Sin recompensas configuradas"
          description="Crea recompensas atractivas para que tus clientes canjeen sus puntos"
          actionLabel="Crear Recompensa"
          onAction={onNewReward}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {catalog.map((reward) => (
            <RewardCard key={reward.id} reward={reward} onEdit={() => {}} />
          ))}
        </div>
      )}
    </div>
  );
};
