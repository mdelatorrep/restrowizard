import { Card, CardContent } from '@/components/ui/card';
import { Truck, Package, Clock, Sparkles } from 'lucide-react';

interface Props {
  total: number;
  active: number;
  categoriesCount: number;
  avgLeadTime: number;
  aiLoading: boolean;
  hasInsights: boolean;
  onAIAnalysis: () => void;
}

export function SuppliersKPIBar({ total, active, categoriesCount, avgLeadTime, aiLoading, hasInsights, onAIAnalysis }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Proveedores</p>
              <p className="text-2xl font-bold">{total}</p>
            </div>
            <div className="p-3 rounded-full bg-primary/10"><Truck className="w-5 h-5 text-primary" /></div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{active} activos</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Categorías</p>
              <p className="text-2xl font-bold">{categoriesCount}</p>
            </div>
            <div className="p-3 rounded-full bg-info/10"><Package className="w-5 h-5 text-info" /></div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">tipos de insumos</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tiempo Entrega Prom.</p>
              <p className="text-2xl font-bold">{avgLeadTime.toFixed(1)} días</p>
            </div>
            <div className="p-3 rounded-full bg-warning/10"><Clock className="w-5 h-5 text-warning" /></div>
          </div>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={onAIAnalysis}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Análisis IA</p>
              <p className="text-lg font-bold text-primary">{aiLoading ? 'Analizando...' : 'Analizar'}</p>
            </div>
            <div className="p-3 rounded-full bg-primary/10"><Sparkles className="w-5 h-5 text-primary" /></div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{hasInsights ? 'Ver insights' : 'Comparar y optimizar'}</p>
        </CardContent>
      </Card>
    </div>
  );
}
