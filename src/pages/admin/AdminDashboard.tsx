import React from 'react';
import { usePlatformStats } from '@/hooks/useSuperAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users, Store, Briefcase, GraduationCap, Wrench, Rocket,
  UserCheck, FileText, Star, Award, TrendingUp
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { data: stats, isLoading } = usePlatformStats();

  const statCards = [
    { label: 'Usuarios totales', value: stats?.total_users, icon: Users, color: 'text-blue-500' },
    { label: 'Restaurantes', value: stats?.total_restaurants, icon: Store, color: 'text-emerald-500' },
    { label: 'Consultores', value: stats?.total_consultants, icon: UserCheck, color: 'text-purple-500' },
    { label: 'Empleos activos', value: stats?.active_jobs, icon: Briefcase, color: 'text-amber-500' },
    { label: 'Candidatos', value: stats?.total_candidates, icon: Users, color: 'text-cyan-500' },
    { label: 'Postulaciones', value: stats?.total_applications, icon: FileText, color: 'text-orange-500' },
    { label: 'Proveedores verificados', value: stats?.active_providers, icon: Wrench, color: 'text-teal-500' },
    { label: 'Solicitudes abiertas', value: stats?.open_requests, icon: FileText, color: 'text-indigo-500' },
    { label: 'Propuestas', value: stats?.total_proposals, icon: TrendingUp, color: 'text-pink-500' },
    { label: 'Reseñas', value: stats?.total_reviews, icon: Star, color: 'text-yellow-500' },
    { label: 'Cursos publicados', value: stats?.published_courses, icon: GraduationCap, color: 'text-violet-500' },
    { label: 'Inscripciones', value: stats?.total_enrollments, icon: Users, color: 'text-lime-500' },
    { label: 'Certificados', value: stats?.total_certificates, icon: Award, color: 'text-rose-500' },
    { label: 'Pre-registros Growth', value: stats?.growth_preregistrations, icon: Rocket, color: 'text-sky-500' },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-3xl font-headline font-bold text-foreground">
          Panel de Administración
        </h1>
        <p className="text-muted-foreground">
          Vista global de toda la plataforma RestroWizard
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="pt-4 pb-3 px-4">
              {isLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="flex items-start gap-3">
                  <card.icon className={`h-5 w-5 mt-0.5 ${card.color}`} />
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {card.value?.toLocaleString() ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
