import { Card, CardContent } from '@/components/ui/card';
import { Factory, Trash2, Droplets, AlertTriangle, Leaf, TrendingDown } from 'lucide-react';
import type { SustainabilityKPIs as KPIs, CarbonItem } from '@/hooks/useSustainabilityData';

interface Props {
  kpis: KPIs | null;
  carbonItems: CarbonItem[];
}

export const SustainabilityKPIs: React.FC<Props> = ({ kpis, carbonItems }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <Card className="border-l-4 border-l-green-500">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Huella de Carbono</p>
            <p className="text-2xl font-bold">{kpis?.totalCarbonFootprint.toFixed(1) || 0} kg</p>
            <p className="text-sm text-green-600 flex items-center gap-1">
              <Leaf className="h-4 w-4" />
              {carbonItems.length} ítems registrados
            </p>
          </div>
          <Factory className="h-10 w-10 text-green-500 opacity-20" />
        </div>
      </CardContent>
    </Card>
    <Card className="border-l-4 border-l-orange-500">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Desperdicio Total</p>
            <p className="text-2xl font-bold">{kpis?.totalWasteKg.toFixed(1) || 0} kg</p>
            <p className="text-sm text-muted-foreground">
              ${kpis?.totalWasteCost.toLocaleString() || 0} en pérdidas
            </p>
          </div>
          <Trash2 className="h-10 w-10 text-orange-500 opacity-20" />
        </div>
      </CardContent>
    </Card>
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Proveedores Locales</p>
            <p className="text-2xl font-bold">{kpis?.localSourcingPercentage.toFixed(0) || 0}%</p>
            <p className="text-sm text-blue-600 flex items-center gap-1">
              <TrendingDown className="h-4 w-4" />
              Menor huella logística
            </p>
          </div>
          <Droplets className="h-10 w-10 text-blue-500 opacity-20" />
        </div>
      </CardContent>
    </Card>
    <Card className="border-l-4 border-l-purple-500">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Desperdicio Prevenible</p>
            <p className="text-2xl font-bold">{kpis?.preventableWastePercentage.toFixed(0) || 0}%</p>
            <p className="text-sm text-muted-foreground">de los residuos eran evitables</p>
          </div>
          <AlertTriangle className="h-10 w-10 text-purple-500 opacity-20" />
        </div>
      </CardContent>
    </Card>
  </div>
);
