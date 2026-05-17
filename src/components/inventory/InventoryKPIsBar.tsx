import {
  Package, AlertTriangle, TrendingDown, DollarSign, Calendar,
  ClipboardList, ClipboardCheck, Trash2,
} from 'lucide-react';
import { KPIGrid, KPICardData, QuickStats } from '@/components/layout';

interface KPIs {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  expiringItems: number;
  expiredItems: number;
  belowParItems: number;
  pendingOrders: number;
  openCounts: number;
  wasteThisMonth: number;
}

interface Props {
  kpis: KPIs | null | undefined;
}

export const InventoryKPIsBar = ({ kpis }: Props) => {
  if (!kpis) return null;
  return (
    <>
      <KPIGrid
        columns={5}
        kpis={[
          { label: 'Total Items', value: kpis.totalItems, icon: Package, iconColor: 'text-primary' },
          { label: 'Valor Total', value: `$${kpis.totalValue.toLocaleString()}`, icon: DollarSign, iconColor: 'text-green-600' },
          { label: 'Bajo Par Level', value: kpis.belowParItems, icon: TrendingDown, iconColor: 'text-yellow-600', highlight: kpis.belowParItems > 0, highlightColor: 'warning' },
          { label: 'Por Vencer', value: kpis.expiringItems, icon: Calendar, iconColor: 'text-orange-500', highlight: kpis.expiringItems > 0, highlightColor: 'warning' },
          { label: 'Agotados', value: kpis.outOfStockItems, icon: AlertTriangle, iconColor: 'text-destructive', highlight: kpis.outOfStockItems > 0, highlightColor: 'danger' },
        ] as KPICardData[]}
      />
      <QuickStats
        items={[
          { icon: ClipboardList, value: kpis.pendingOrders, label: 'OC pendientes' },
          { icon: ClipboardCheck, value: kpis.openCounts, label: 'conteos abiertos' },
          { icon: Trash2, value: `$${kpis.wasteThisMonth.toLocaleString()}`, label: 'merma este mes', variant: 'danger' },
        ]}
      />
    </>
  );
};
