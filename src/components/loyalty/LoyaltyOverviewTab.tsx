import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Crown, Heart, Plus, Sparkles, Target, Zap } from 'lucide-react';
import { TierBadge } from '@/components/loyalty/LoyaltyCards';
import type { LoyaltyCustomer, LoyaltyTier } from '@/hooks/useLoyaltyData';

interface Props {
  atRiskCustomers: LoyaltyCustomer[];
  vipCustomers: LoyaltyCustomer[];
  tiers: LoyaltyTier[];
  tierDistribution: Record<string, number>;
  customers: LoyaltyCustomer[];
  onCreateTier: () => void;
}

export const LoyaltyOverviewTab = ({
  atRiskCustomers,
  vipCustomers,
  tiers,
  tierDistribution,
  customers,
  onCreateTier,
}: Props) => (
  <div className="grid gap-6 lg:grid-cols-2">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-5 h-5" />
          Clientes en Riesgo
        </CardTitle>
        <CardDescription>Requieren atención para evitar abandono</CardDescription>
      </CardHeader>
      <CardContent>
        {atRiskCustomers.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            <Heart className="w-8 h-8 mx-auto mb-2 text-green-500" />
            Todos tus clientes están activos
          </p>
        ) : (
          <div className="space-y-3">
            {atRiskCustomers.slice(0, 5).map((customer) => (
              <div key={customer.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">{customer.customer_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {customer.days_since_last_order} días sin comprar
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  <Zap className="w-4 h-4 mr-1" /> Recuperar
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-500" />
          Clientes VIP
        </CardTitle>
        <CardDescription>Tus mejores clientes por lifetime value</CardDescription>
      </CardHeader>
      <CardContent>
        {vipCustomers.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">Aún no hay clientes VIP</p>
        ) : (
          <div className="space-y-3">
            {vipCustomers.slice(0, 5).map((customer, idx) => (
              <div key={customer.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-medium">{customer.customer_name}</p>
                    <p className="text-sm text-muted-foreground">
                      ${customer.total_spent.toLocaleString()} total
                    </p>
                  </div>
                </div>
                <TierBadge tier={customer.tier} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Distribución por Nivel
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tiers.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-3">Configura los niveles de tu programa</p>
            <Button variant="outline" onClick={onCreateTier}>
              <Plus className="w-4 h-4 mr-2" /> Crear Nivel
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(tierDistribution).map(([tierName, count]) => {
              const tier = tiers.find((t) => t.name === tierName);
              const percentage = customers.length > 0 ? (count / customers.length) * 100 : 0;
              return (
                <div key={tierName} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: tier?.color }}>{tierName}</span>
                    <span className="text-muted-foreground">{count} ({Math.round(percentage)}%)</span>
                  </div>
                  <Progress
                    value={percentage}
                    className="h-2"
                    style={{ '--progress-color': tier?.color } as React.CSSProperties}
                  />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Insights IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5">
          <p className="text-sm font-medium mb-2">Oportunidad detectada</p>
          <p className="text-sm text-muted-foreground">
            {atRiskCustomers.length > 0
              ? `${atRiskCustomers.length} clientes podrían reactivarse con una campaña de ${Math.round(atRiskCustomers.length * 50)} puntos bonus`
              : 'Tu programa de fidelización está funcionando correctamente'}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-muted/50">
          <p className="text-sm font-medium mb-2">Próximos cumpleaños</p>
          <p className="text-sm text-muted-foreground">
            {customers.filter((c) => c.birthday).length > 0
              ? `${customers.filter((c) => c.birthday).length} clientes tienen cumpleaños registrado`
              : 'Registra cumpleaños para campañas personalizadas'}
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
);
