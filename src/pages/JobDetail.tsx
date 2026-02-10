import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, MapPin, Clock, Building2, Flame, Briefcase, GraduationCap, Globe, Gift, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ApplyDialog from '@/components/jobs/ApplyDialog';
import type { Tables } from '@/integrations/supabase/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const categoryLabels: Record<string, string> = {
  kitchen: 'Cocina', service: 'Servicio', management: 'Gestión', bartender: 'Bartender',
  cleaning: 'Limpieza', delivery: 'Domicilios', other: 'Otro', marketing: 'Marketing',
  finance: 'Finanzas', administration: 'Administración',
};
const jobTypeLabels: Record<string, string> = {
  full_time: 'Tiempo completo', part_time: 'Medio tiempo', contract: 'Contrato',
  temporary: 'Temporal', internship: 'Pasantía',
};
const levelLabels: Record<string, string> = {
  entry: 'Entrada', junior: 'Junior', mid: 'Intermedio', senior: 'Senior', executive: 'Ejecutivo',
};
const remoteLabels: Record<string, string> = {
  onsite: 'Presencial', hybrid: 'Híbrido', remote: 'Remoto',
};

const JobDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<Tables<'jobs'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      // Increment views
      await supabase.rpc('increment_job_views', { job_id: id });
      const { data, error } = await supabase.from('jobs').select('*').eq('id', id).single();
      if (!error) setJob(data);
      setLoading(false);
    };
    load();
  }, [id]);

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return 'A convenir';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `Desde $${min.toLocaleString()}`;
    return `Hasta $${max!.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-28 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-28 text-center">
          <h1 className="text-2xl font-bold">Oferta no encontrada</h1>
          <Button className="mt-4" onClick={() => navigate('/jobs')}>Volver a empleos</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-24 pb-8 bg-gradient-to-br from-primary via-secondary to-primary">
        <div className="container mx-auto px-4">
          <Button variant="ghost" className="text-primary-foreground mb-4" onClick={() => navigate('/jobs')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver a empleos
          </Button>
          <div className="flex items-start gap-5">
            <div className="shrink-0 w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center overflow-hidden">
              {job.company_logo_url ? (
                <img src={job.company_logo_url} alt="" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <Building2 className="h-8 w-8 text-primary-foreground" />
              )}
            </div>
            <div className="text-primary-foreground">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-3xl font-bold">{job.title}</h1>
                {job.urgent && (
                  <Badge className="bg-destructive text-destructive-foreground gap-1">
                    <Flame className="h-3 w-3" /> Urgente
                  </Badge>
                )}
              </div>
              <p className="text-lg opacity-90 mt-1">{job.company_name || 'Restaurante verificado'}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {job.location && <Badge variant="secondary" className="gap-1"><MapPin className="h-3 w-3" />{job.location}</Badge>}
                <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />{jobTypeLabels[job.job_type]}</Badge>
                <Badge variant="secondary" className="gap-1"><Briefcase className="h-3 w-3" />{categoryLabels[job.category]}</Badge>
                <Badge variant="secondary" className="gap-1"><GraduationCap className="h-3 w-3" />{levelLabels[job.experience_level]}</Badge>
                {job.remote_option && job.remote_option !== 'onsite' && (
                  <Badge variant="secondary" className="gap-1"><Globe className="h-3 w-3" />{remoteLabels[job.remote_option]}</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold mb-3">Descripción del puesto</h2>
                    <p className="text-muted-foreground whitespace-pre-line">{job.description}</p>
                  </div>

                  {job.responsibilities && (
                    <div>
                      <h2 className="text-lg font-semibold mb-3">Responsabilidades</h2>
                      <p className="text-muted-foreground whitespace-pre-line">{job.responsibilities}</p>
                    </div>
                  )}

                  {job.requirements && (
                    <div>
                      <h2 className="text-lg font-semibold mb-3">Requisitos</h2>
                      <p className="text-muted-foreground whitespace-pre-line">{job.requirements}</p>
                    </div>
                  )}

                  {job.skills_required && job.skills_required.length > 0 && (
                    <div>
                      <h2 className="text-lg font-semibold mb-3">Habilidades requeridas</h2>
                      <div className="flex flex-wrap gap-2">
                        {job.skills_required.map((s, i) => (
                          <Badge key={i} variant="secondary">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {job.benefits && (
                    <div>
                      <h2 className="text-lg font-semibold mb-3">Beneficios</h2>
                      <p className="text-muted-foreground whitespace-pre-line">{job.benefits}</p>
                    </div>
                  )}

                  {job.perks && job.perks.length > 0 && (
                    <div>
                      <h2 className="text-lg font-semibold mb-3">Ventajas adicionales</h2>
                      <div className="flex flex-wrap gap-2">
                        {job.perks.map((p, i) => (
                          <Badge key={i} variant="outline" className="gap-1">
                            <Gift className="h-3 w-3" />{p}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <Button className="w-full" size="lg" onClick={() => setApplyOpen(true)}>
                    Postularse ahora
                  </Button>
                  <Separator />
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Salario</span>
                      <span className="font-semibold">{formatSalary(job.salary_min, job.salary_max)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Candidatos</span>
                      <span className="font-semibold">{job.applications_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vistas</span>
                      <span className="font-semibold">{job.views_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Publicado</span>
                      <span className="font-semibold">
                        {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: es })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-accent/30 border-primary/10">
                <CardContent className="p-4 text-center text-sm">
                  <p className="text-muted-foreground">
                    Solo restaurantes registrados en <strong className="text-primary">RestroWizard</strong> pueden publicar ofertas.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {applyOpen && <ApplyDialog open={applyOpen} onOpenChange={setApplyOpen} job={job} />}
      <Footer />
    </div>
  );
};

export default JobDetail;
