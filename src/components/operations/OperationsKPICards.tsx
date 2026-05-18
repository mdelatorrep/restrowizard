import React from 'react';
import { Star, Heart, Clock, BarChart3 } from 'lucide-react';
import { OperationsMetric } from './OperationsMetric';

interface Props {
  kpis: any;
  benchmarks: any;
  loyaltyTotal: number;
}

export const OperationsKPICards: React.FC<Props> = ({ kpis, benchmarks, loyaltyTotal }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <OperationsMetric
      icon={<Star />}
      title="Satisfacción Cliente"
      value={`${kpis?.customerSatisfaction?.toFixed(1) || '4.0'}/5`}
      trend="up"
      description="Promedio ponderado omnicanal"
      colorClass="bg-yellow-100 text-yellow-600"
    />
    <OperationsMetric
      icon={<Heart />}
      title="Miembros Lealtad"
      value={`${loyaltyTotal}`}
      trend="up"
      description="Clientes en programa de fidelidad"
      colorClass="bg-pink-100 text-pink-600"
    />
    <OperationsMetric
      icon={<Clock />}
      title="Tiempo Promedio Orden"
      value={`${kpis?.avgOrderTime || 18} min`}
      trend={kpis?.avgOrderTime && benchmarks?.avgOrderTime && kpis.avgOrderTime <= benchmarks.avgOrderTime ? 'up' : 'down'}
      description={`Benchmark: ${benchmarks?.avgOrderTime || 18} min`}
      colorClass="bg-green-100 text-green-600"
    />
    <OperationsMetric
      icon={<BarChart3 />}
      title="Pedidos Hoy"
      value={kpis?.ordersToday?.toString() || '0'}
      trend="up"
      description={`${kpis?.completedOrders || 0} completados`}
      colorClass="bg-blue-100 text-blue-600"
    />
  </div>
);
