import React from 'react';
import { formatCurrency } from '@/lib/formatCurrency';
import { DollarSign, Target, Calculator, Gauge } from 'lucide-react';
import { MetricCard } from './MetricCard';

interface KPIs {
  totalRevenue: number;
  grossMargin: number;
  foodCostPercentage: number;
  averageTicket: number;
  totalCovers: number;
}

export const FinancesKPIs: React.FC<{ kpis: KPIs | null; salesCount: number }> = ({ kpis, salesCount }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <MetricCard icon={<DollarSign />} title="Ingresos Totales"
      value={`$${kpis ? new Intl.NumberFormat().format(kpis.totalRevenue) : '0'}`}
      trend="up" description={`${salesCount} registros`} colorClass="bg-green-100 text-green-600" />
    <MetricCard icon={<Target />} title="Margen Bruto"
      value={`${kpis?.grossMargin.toFixed(1) || 0}%`}
      trend={kpis && kpis.grossMargin > 60 ? 'up' : 'down'}
      description="Ingresos - Costo alimentos" colorClass="bg-blue-100 text-blue-600" />
    <MetricCard icon={<Calculator />} title="Food Cost"
      value={`${kpis?.foodCostPercentage.toFixed(1) || 0}%`}
      trend={kpis && kpis.foodCostPercentage < 30 ? 'up' : 'down'}
      description="% de costo de alimentos" colorClass="bg-orange-100 text-orange-600" />
    <MetricCard icon={<Gauge />} title="Ticket Promedio"
      value={`$${kpis?.averageTicket.toFixed(0) || 0}`}
      trend="neutral" description={`${kpis?.totalCovers || 0} cubiertos totales`}
      colorClass="bg-purple-100 text-purple-600" />
  </div>
);
