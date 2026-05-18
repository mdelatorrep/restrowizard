import { Card, CardContent } from '@/components/ui/card';
import { Package, DollarSign, Store, Timer, TrendingUp } from 'lucide-react';
import type { DisplayBrand } from './ghostKitchenHelpers';

interface Props {
  totalOrders: number;
  totalRevenue: number;
  commissionPaid: number;
  productionQueueLength: number;
  displayBrands: DisplayBrand[];
}

export const GhostKitchenKPIs: React.FC<Props> = ({ totalOrders, totalRevenue, commissionPaid, productionQueueLength, displayBrands }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
    <Card><CardContent className="pt-6"><div className="flex items-center justify-between">
      <div><p className="text-sm text-muted-foreground">Órdenes Hoy</p><p className="text-2xl font-bold">{totalOrders}</p></div>
      <Package className="h-8 w-8 text-primary opacity-20" />
    </div></CardContent></Card>
    <Card><CardContent className="pt-6"><div className="flex items-center justify-between">
      <div><p className="text-sm text-muted-foreground">Ingresos Hoy</p><p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p></div>
      <DollarSign className="h-8 w-8 text-green-500 opacity-20" />
    </div></CardContent></Card>
    <Card><CardContent className="pt-6"><div className="flex items-center justify-between">
      <div><p className="text-sm text-muted-foreground">Marcas Activas</p><p className="text-2xl font-bold">{displayBrands.filter(b => b.status === 'active').length}</p></div>
      <Store className="h-8 w-8 text-blue-500 opacity-20" />
    </div></CardContent></Card>
    <Card><CardContent className="pt-6"><div className="flex items-center justify-between">
      <div><p className="text-sm text-muted-foreground">En Producción</p><p className="text-2xl font-bold">{productionQueueLength}</p></div>
      <Timer className="h-8 w-8 text-orange-500 opacity-20" />
    </div></CardContent></Card>
    <Card><CardContent className="pt-6"><div className="flex items-center justify-between">
      <div><p className="text-sm text-muted-foreground">Comisiones</p><p className="text-2xl font-bold text-destructive">-${commissionPaid.toLocaleString()}</p></div>
      <TrendingUp className="h-8 w-8 text-destructive opacity-20" />
    </div></CardContent></Card>
  </div>
);
