import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, GraduationCap, Wrench, Rocket, Users, BookOpen, Award, FileText, Star, ShoppingBag } from 'lucide-react';
import restrojobsLogo from '@/assets/logos/restrojobs.png';
import restrolearnLogo from '@/assets/logos/restrolearn.png';
import restroservicesLogo from '@/assets/logos/restroservices.png';
import restrogrowthLogo from '@/assets/logos/restrogrowth.png';

const EcosystemDashboard: React.FC = () => {
  const { data: jobsStats } = useQuery({
    queryKey: ['ecosystem-jobs-stats'],
    queryFn: async () => {
      const [{ count: activeJobs }, { count: totalCandidates }, { count: totalApplications }] = await Promise.all([
        supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('candidate_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('job_applications').select('*', { count: 'exact', head: true }),
      ]);
      return { activeJobs: activeJobs || 0, totalCandidates: totalCandidates || 0, totalApplications: totalApplications || 0 };
    },
  });

  const { data: learnStats } = useQuery({
    queryKey: ['ecosystem-learn-stats'],
    queryFn: async () => {
      const [{ count: courses }, { count: enrollments }, { count: certificates }] = await Promise.all([
        supabase.from('training_courses').select('*', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('course_enrollments').select('*', { count: 'exact', head: true }),
        supabase.from('course_certificates').select('*', { count: 'exact', head: true }),
      ]);
      return { courses: courses || 0, enrollments: enrollments || 0, certificates: certificates || 0 };
    },
  });

  const { data: servicesStats } = useQuery({
    queryKey: ['ecosystem-services-stats'],
    queryFn: async () => {
      const [{ count: providers }, { count: openRequests }, { count: proposals }] = await Promise.all([
        supabase.from('service_providers').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('service_requests').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('service_proposals').select('*', { count: 'exact', head: true }),
      ]);
      return { providers: providers || 0, openRequests: openRequests || 0, proposals: proposals || 0 };
    },
  });

  const { data: growthStats } = useQuery({
    queryKey: ['ecosystem-growth-stats'],
    queryFn: async () => {
      const { count } = await supabase.from('growth_preregistrations').select('*', { count: 'exact', head: true });
      return { preregistrations: count || 0 };
    },
  });

  const sections = [
    {
      logo: restrojobsLogo,
      title: 'RestroJobs',
      color: 'text-blue-500',
      items: [
        { icon: Briefcase, label: 'Empleos activos', value: jobsStats?.activeJobs ?? '—' },
        { icon: Users, label: 'Candidatos', value: jobsStats?.totalCandidates ?? '—' },
        { icon: FileText, label: 'Postulaciones', value: jobsStats?.totalApplications ?? '—' },
      ],
    },
    {
      logo: restrolearnLogo,
      title: 'RestroLearn',
      color: 'text-emerald-500',
      items: [
        { icon: BookOpen, label: 'Cursos publicados', value: learnStats?.courses ?? '—' },
        { icon: GraduationCap, label: 'Inscripciones', value: learnStats?.enrollments ?? '—' },
        { icon: Award, label: 'Certificados', value: learnStats?.certificates ?? '—' },
      ],
    },
    {
      logo: restroservicesLogo,
      title: 'RestroServices',
      color: 'text-orange-500',
      items: [
        { icon: Wrench, label: 'Proveedores activos', value: servicesStats?.providers ?? '—' },
        { icon: ShoppingBag, label: 'Solicitudes abiertas', value: servicesStats?.openRequests ?? '—' },
        { icon: Star, label: 'Propuestas', value: servicesStats?.proposals ?? '—' },
      ],
    },
    {
      logo: restrogrowthLogo,
      title: 'RestroGrowth',
      color: 'text-purple-500',
      items: [
        { icon: Rocket, label: 'Pre-registros', value: growthStats?.preregistrations ?? '—' },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {sections.map((s) => (
        <Card key={s.title}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-headline">
              <img src={s.logo} alt="" className="h-5 w-auto" />
              {s.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {s.items.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </div>
                <span className="font-bold text-lg">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default EcosystemDashboard;
