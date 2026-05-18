import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Crown, Plus, Star } from 'lucide-react';
import type { LoyaltyTier } from '@/hooks/useLoyaltyData';

interface Props {
  tiers: LoyaltyTier[];
  tierDistribution: Record<string, number>;
  onNewTier: () => void;
}

export const LoyaltyTiersTab = ({ tiers, tierDistribution, onNewTier }: Props) => (
  <div className="space-y-4">
    <div className="flex justify-end">
      <Button onClick={onNewTier}>
        <Plus className="w-4 h-4 mr-2" /> Nuevo Nivel
      </Button>
    </div>

    {tiers.length === 0 ? (
      <EmptyState
        icon={<Crown className="w-12 h-12" />}
        title="Sin niveles configurados"
        description="Crea niveles para gamificar tu programa y motivar a los clientes"
        actionLabel="Crear Nivel"
        onAction={onNewTier}
      />
    ) : (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiers.map((tier) => (
          <Card key={tier.id} className="overflow-hidden">
            <div className="h-2" style={{ backgroundColor: tier.color }} />
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5" style={{ color: tier.color }} />
                <h3 className="font-semibold">{tier.name}</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Puntos mínimos</span>
                  <span className="font-medium">{tier.min_points.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Multiplicador</span>
                  <span className="font-medium">{tier.points_multiplier}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Miembros</span>
                  <span className="font-medium">{tierDistribution[tier.name] || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )}
  </div>
);
