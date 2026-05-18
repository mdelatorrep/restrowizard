import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  DollarSign,
  PieChart,
  Users,
} from 'lucide-react';

interface KPI {
  totalRevenue: number;
  totalOrders: number;
  grossMargin: number;
  foodCostPercentage: number;
  totalFoodCost: number;
  laborCostPercentage: number;
  totalLaborCost: number;
}

export const FinancesKPICards = ({ kpis }: { kpis: KPI }) => (
  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="rounded-full p-3 bg-green-100 text-green-600">
            <DollarSign className="h-6 w-6" />
          </div>
          <ArrowUpRight className="h-5 w-5 text-green-600" />
        </div>
        <div className="mt-4">
          <h3 className="text-2xl font-bold">${kpis.totalRevenue.toLocaleString()}</h3>
          <p className="text-sm text-muted-foreground">Ingresos Totales</p>
          <p className="text-xs text-muted-foreground">{kpis.totalOrders} órdenes</p>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="rounded-full p-3 bg-blue-100 text-blue-600">
            <Calculator className="h-6 w-6" />
          </div>
          {kpis.grossMargin >= 60
            ? <ArrowUpRight className="h-5 w-5 text-green-600" />
            : <ArrowDownRight className="h-5 w-5 text-red-600" />}
        </div>
        <div className="mt-4">
          <h3 className="text-2xl font-bold">{kpis.grossMargin.toFixed(1)}%</h3>
          <p className="text-sm text-muted-foreground">Margen Bruto</p>
          <p className="text-xs text-muted-foreground">Meta: ≥60%</p>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="rounded-full p-3 bg-orange-100 text-orange-600">
            <PieChart className="h-6 w-6" />
          </div>
          {kpis.foodCostPercentage <= 32
            ? <ArrowDownRight className="h-5 w-5 text-green-600" />
            : <ArrowUpRight className="h-5 w-5 text-red-600" />}
        </div>
        <div className="mt-4">
          <h3 className="text-2xl font-bold">{kpis.foodCostPercentage.toFixed(1)}%</h3>
          <p className="text-sm text-muted-foreground">Food Cost</p>
          <p className="text-xs text-muted-foreground">${kpis.totalFoodCost.toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="rounded-full p-3 bg-purple-100 text-purple-600">
            <Users className="h-6 w-6" />
          </div>
          {kpis.laborCostPercentage <= 28
            ? <ArrowDownRight className="h-5 w-5 text-green-600" />
            : <ArrowUpRight className="h-5 w-5 text-red-600" />}
        </div>
        <div className="mt-4">
          <h3 className="text-2xl font-bold">{kpis.laborCostPercentage.toFixed(1)}%</h3>
          <p className="text-sm text-muted-foreground">Labor Cost</p>
          <p className="text-xs text-muted-foreground">${kpis.totalLaborCost.toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  </div>
);
