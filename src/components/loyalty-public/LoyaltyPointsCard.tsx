import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Star, Sparkles, CheckCircle2 } from 'lucide-react';
import type { LoyaltyCustomer, LoyaltyTier } from './loyaltyTypes';

interface Props {
  customer: LoyaltyCustomer;
  nextTier: LoyaltyTier | null;
  tierProgress: number;
}

export const LoyaltyPointsCard = ({ customer, nextTier, tierProgress }: Props) => (
  <Card className="shadow-lg">
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground">Puntos disponibles</p>
          <p className="text-4xl font-bold text-primary">{customer.current_points.toLocaleString()}</p>
        </div>
        {customer.tier && (
          <Badge className="text-white font-semibold px-4 py-2" style={{ backgroundColor: customer.tier.color }}>
            <Star className="w-4 h-4 mr-1" />
            {customer.tier.name}
          </Badge>
        )}
      </div>

      {nextTier && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progreso al siguiente nivel</span>
            <span className="font-medium" style={{ color: nextTier.color }}>{nextTier.name}</span>
          </div>
          <Progress value={tierProgress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{customer.lifetime_points.toLocaleString()} pts acumulados</span>
            <span>{nextTier.min_points.toLocaleString()} pts requeridos</span>
          </div>
        </div>
      )}

      {customer.tier?.benefits && customer.tier.benefits.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm font-medium mb-2 flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-primary" />
            Beneficios de tu nivel
          </p>
          <ul className="space-y-1">
            {customer.tier.benefits.map((benefit, idx) => (
              <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      )}
    </CardContent>
  </Card>
);
