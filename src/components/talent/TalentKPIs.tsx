import React from 'react';
import { Users, Award, GraduationCap, Target } from 'lucide-react';
import { StaffMetric } from './StaffMetric';

interface KPIs {
  activeStaff: number;
  totalStaff: number;
  avgPerformance: number;
  avgTrainingProgress: number;
  avgHourlyRate: number;
}

export const TalentKPIs: React.FC<{ kpis: KPIs | null }> = ({ kpis }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <StaffMetric icon={<Users />} title="Personal Activo"
      value={kpis?.activeStaff.toString() || '0'} trend="neutral"
      description={`${kpis?.totalStaff || 0} total registrados`}
      colorClass="bg-blue-100 text-blue-600" />
    <StaffMetric icon={<Award />} title="Rendimiento Promedio"
      value={`${kpis?.avgPerformance.toFixed(0) || 0}%`}
      trend={kpis && kpis.avgPerformance > 70 ? 'up' : 'down'}
      description="Score general del equipo"
      colorClass="bg-green-100 text-green-600" />
    <StaffMetric icon={<GraduationCap />} title="Progreso Capacitación"
      value={`${kpis?.avgTrainingProgress.toFixed(0) || 0}%`}
      trend="up" description="Completación promedio"
      colorClass="bg-purple-100 text-purple-600" />
    <StaffMetric icon={<Target />} title="Tarifa Promedio"
      value={`$${kpis?.avgHourlyRate.toFixed(0) || 0}/hr`}
      trend="neutral" description="Costo por hora"
      colorClass="bg-orange-100 text-orange-600" />
  </div>
);
