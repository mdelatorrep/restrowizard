import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, TrendingUp, Coins, AlertTriangle, ArrowUpRight } from 'lucide-react';

interface Kpis {
  totalCustomers: number;
  activeCustomers: number;
  avgLTV: number;
  totalPointsCirculating: number;
  avgPointsPerCustomer: number;
  atRiskCustomers: number;
  retentionRate: number;
}

export const LoyaltyKPIs = ({ kpis, atRiskCount }: { kpis: Kpis; atRiskCount: number }) => (
  <div className="grid gap-4 md:grid-cols-4">
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Miembros</p>
            <p className="text-2xl font-bold">{kpis.totalCustomers}</p>
          </div>
          <div className="p-3 rounded-full bg-primary/10">
            <Users className="w-5 h-5 text-primary" />
          </div>
        </div>
        <div className="mt-2 flex items-center text-sm text-green-600">
          <ArrowUpRight className="w-4 h-4" />
          <span>{kpis.activeCustomers} activos</span>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">LTV Promedio</p>
            <p className="text-2xl font-bold">${kpis.avgLTV.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
        </div>
        <Progress value={75} className="mt-3 h-1" />
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Puntos en Circulación</p>
            <p className="text-2xl font-bold">{kpis.totalPointsCirculating.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
            <Coins className="w-5 h-5 text-yellow-600" />
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          ~{kpis.avgPointsPerCustomer} por cliente
        </p>
      </CardContent>
    </Card>

    <Card className={atRiskCount > 0 ? 'border-destructive/50' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">En Riesgo</p>
            <p className="text-2xl font-bold">{kpis.atRiskCustomers}</p>
          </div>
          <div className="p-3 rounded-full bg-destructive/10">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
        </div>
        <div className="mt-2 flex items-center text-sm text-muted-foreground">
          <span>Retención: {kpis.retentionRate}%</span>
        </div>
      </CardContent>
    </Card>
  </div>
);
