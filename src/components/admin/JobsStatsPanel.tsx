import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Users, Eye, Flame, TrendingUp, FileText } from 'lucide-react';

const JobsStatsPanel: React.FC = () => {
  const { data: stats } = useQuery({
    queryKey: ['jobs-global-stats'],
    queryFn: async () => {
      const [
        { count: totalJobs },
        { count: activeJobs },
        { count: urgentJobs },
        { count: totalApplications },
        { count: totalCandidates },
        { data: viewsData },
      ] = await Promise.all([
        supabase.from('jobs').select('*', { count: 'exact', head: true }),
        supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('urgent', true).eq('is_active', true),
        supabase.from('job_applications').select('*', { count: 'exact', head: true }),
        supabase.from('candidate_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('jobs').select('views_count'),
      ]);
      const totalViews = (viewsData || []).reduce((sum: number, j: any) => sum + (j.views_count || 0), 0);
      return {
        totalJobs: totalJobs || 0,
        activeJobs: activeJobs || 0,
        urgentJobs: urgentJobs || 0,
        totalApplications: totalApplications || 0,
        totalCandidates: totalCandidates || 0,
        totalViews,
      };
    },
  });

  const kpis = [
    { icon: Briefcase, label: 'Empleos Totales', value: stats?.totalJobs ?? '—', sub: `${stats?.activeJobs ?? 0} activos` },
    { icon: Flame, label: 'Urgentes', value: stats?.urgentJobs ?? '—', color: 'text-destructive' },
    { icon: FileText, label: 'Postulaciones', value: stats?.totalApplications ?? '—' },
    { icon: Users, label: 'Candidatos Registrados', value: stats?.totalCandidates ?? '—' },
    { icon: Eye, label: 'Vistas Totales', value: stats?.totalViews ?? '—' },
    { icon: TrendingUp, label: 'Tasa Postulación', value: stats && stats.totalJobs > 0 ? `${((stats.totalApplications / stats.totalJobs) * 100).toFixed(0)} por empleo` : '—' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <kpi.icon className={`h-4 w-4 ${(kpi as any).color || ''}`} />
              {kpi.label}
            </div>
            <div className="text-2xl font-bold">{kpi.value}</div>
            {(kpi as any).sub && <p className="text-xs text-muted-foreground mt-0.5">{(kpi as any).sub}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default JobsStatsPanel;
