import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Bookmark, BookmarkCheck, Flame, Building2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import type { Tables } from '@/integrations/supabase/types';

type Job = Tables<'jobs'>;

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

interface JobCardProps {
  job: Job;
  isSaved?: boolean;
  onToggleSave?: () => void;
  showSaveButton?: boolean;
}

const JobCard: React.FC<JobCardProps> = ({ job, isSaved, onToggleSave, showSaveButton = true }) => {
  const navigate = useNavigate();

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return 'A convenir';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `Desde $${min.toLocaleString()}`;
    return `Hasta $${max!.toLocaleString()}`;
  };

  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50 hover:border-primary/30"
      onClick={() => navigate(`/jobs/${job.id}`)}
    >
      <CardContent className="p-5">
        <div className="flex gap-4">
          {/* Logo */}
          <div className="shrink-0 w-14 h-14 rounded-xl bg-accent/50 flex items-center justify-center overflow-hidden">
            {job.company_logo_url ? (
              <img src={job.company_logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <Building2 className="h-6 w-6 text-muted-foreground" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {job.title}
                </h3>
                <p className="text-sm text-muted-foreground font-medium">
                  {job.company_name || 'Restaurante verificado'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {job.urgent && (
                  <Badge className="bg-destructive/10 text-destructive border-destructive/20 gap-1">
                    <Flame className="h-3 w-3" /> Urgente
                  </Badge>
                )}
                {showSaveButton && onToggleSave && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
                  >
                    {isSaved ? (
                      <BookmarkCheck className="h-4 w-4 text-primary" />
                    ) : (
                      <Bookmark className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {job.location && (
                <Badge variant="secondary" className="text-xs gap-1 font-normal">
                  <MapPin className="h-3 w-3" /> {job.location}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs gap-1 font-normal">
                <Clock className="h-3 w-3" /> {jobTypeLabels[job.job_type] || job.job_type}
              </Badge>
              <Badge variant="outline" className="text-xs font-normal">
                {categoryLabels[job.category] || job.category}
              </Badge>
              <Badge variant="outline" className="text-xs font-normal">
                {levelLabels[job.experience_level] || job.experience_level}
              </Badge>
            </div>

            {/* Skills */}
            {job.skills_required && job.skills_required.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {job.skills_required.slice(0, 4).map((skill, i) => (
                  <Badge key={i} variant="secondary" className="text-xs bg-primary/5 text-primary border-primary/10">
                    {skill}
                  </Badge>
                ))}
                {job.skills_required.length > 4 && (
                  <Badge variant="secondary" className="text-xs">+{job.skills_required.length - 4}</Badge>
                )}
              </div>
            )}

            {/* Bottom row */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: es })}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-primary">
                  {formatSalary(job.salary_min, job.salary_max)}
                </span>
                <Button size="sm" className="h-8" onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${job.id}`); }}>
                  Ver oferta
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobCard;
