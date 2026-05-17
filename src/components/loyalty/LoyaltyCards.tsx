import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, AlertTriangle, QrCode, Eye, Coins, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LoyaltyCustomer, LoyaltyTier, RewardsCatalogItem } from '@/hooks/useLoyaltyData';

export const TierBadge = ({ tier }: { tier?: LoyaltyTier }) => {
  if (!tier) return <Badge variant="outline">Sin nivel</Badge>;
  return (
    <Badge style={{ backgroundColor: tier.color, color: '#fff' }} className="font-medium">
      <Star className="w-3 h-3 mr-1" />
      {tier.name}
    </Badge>
  );
};

export const CustomerCard = ({
  customer,
  onViewDetails,
  onAwardPoints,
  onShowQR,
}: {
  customer: LoyaltyCustomer;
  onViewDetails: () => void;
  onAwardPoints: () => void;
  onShowQR: () => void;
}) => {
  const isAtRisk =
    customer.churn_risk_score >= 0.6 ||
    (customer.days_since_last_order && customer.days_since_last_order > 45);

  return (
    <Card className={cn('transition-all hover:shadow-md', isAtRisk && 'border-destructive/50 bg-destructive/5')}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold">{customer.customer_name}</h3>
            <p className="text-sm text-muted-foreground">
              {customer.customer_email || customer.customer_phone || 'Sin contacto'}
            </p>
          </div>
          <TierBadge tier={customer.tier} />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3 text-center">
          <div>
            <p className="text-lg font-bold text-primary">{customer.current_points}</p>
            <p className="text-xs text-muted-foreground">Puntos</p>
          </div>
          <div>
            <p className="text-lg font-bold">{customer.total_orders}</p>
            <p className="text-xs text-muted-foreground">Órdenes</p>
          </div>
          <div>
            <p className="text-lg font-bold">${customer.total_spent.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>

        {isAtRisk && (
          <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>
              {customer.days_since_last_order
                ? `${customer.days_since_last_order} días sin comprar`
                : 'Riesgo de abandono'}
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onShowQR}>
            <QrCode className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={onViewDetails}>
            <Eye className="w-4 h-4 mr-1" /> Ver
          </Button>
          <Button size="sm" className="flex-1" onClick={onAwardPoints}>
            <Coins className="w-4 h-4 mr-1" /> +Puntos
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const TYPE_LABELS: Record<string, string> = {
  discount_percent: 'Descuento %',
  discount_fixed: 'Descuento $',
  free_item: 'Producto Gratis',
  free_delivery: 'Delivery Gratis',
  experience: 'Experiencia',
  upgrade: 'Upgrade',
};

export const RewardCard = ({
  reward,
  onEdit: _onEdit,
}: {
  reward: RewardsCatalogItem;
  onEdit: () => void;
}) => (
  <Card className="overflow-hidden hover:shadow-md transition-shadow">
    <div className="h-24 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
      <Gift className="w-10 h-10 text-primary" />
    </div>
    <CardContent className="p-4">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold">{reward.name}</h3>
        <Badge variant="secondary">{TYPE_LABELS[reward.reward_type]}</Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
        {reward.description || 'Sin descripción'}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-primary font-bold">
          <Coins className="w-4 h-4" />
          {reward.points_required}
        </div>
        {reward.stock_limit && (
          <span className="text-xs text-muted-foreground">
            {reward.stock_limit - reward.stock_used} disponibles
          </span>
        )}
      </div>
    </CardContent>
  </Card>
);
