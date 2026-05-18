import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useCandidateProfile } from '@/hooks/useCandidateProfile';
import { useJobApplications } from '@/hooks/useJobApplications';
import { Loader2, User, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Tables } from '@/integrations/supabase/types';
import { JobApplicationSchema } from '@/lib/schemas/jobApplication';
import { useToast } from '@/hooks/use-toast';

interface ApplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Tables<'jobs'>;
}

const ApplyDialog: React.FC<ApplyDialogProps> = ({ open, onOpenChange, job }) => {
  const { user } = useAuth();
  const { profile, profileLoading } = useCandidateProfile();
  const { applyToJob } = useJobApplications();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [coverLetter, setCoverLetter] = useState('');

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inicia sesión para postularte</DialogTitle>
            <DialogDescription>Necesitas una cuenta para enviar tu postulación.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => { onOpenChange(false); navigate('/auth'); }}>
              Iniciar sesión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (profileLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent><div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div></DialogContent>
      </Dialog>
    );
  }

  if (!profile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Completa tu perfil profesional
            </DialogTitle>
            <DialogDescription>
              Para postularte necesitas crear tu perfil de candidato con tu experiencia y habilidades.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={() => { onOpenChange(false); navigate('/jobs/mi-perfil'); }}>
              Crear perfil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const handleSubmit = () => {
    const parsed = JobApplicationSchema.safeParse({
      job_id: job.id,
      cover_letter: coverLetter,
      resume_url: profile.resume_url || undefined,
      candidate_profile_id: profile.id,
      applicant_name: profile.full_name,
      applicant_email: user.email || undefined,
      applicant_phone: profile.phone || undefined,
    });
    if (!parsed.success) {
      toast({
        title: 'Datos inválidos',
        description: parsed.error.issues[0]?.message ?? 'Revisa la información',
        variant: 'destructive',
      });
      return;
    }
    applyToJob.mutate(parsed.data, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Postularse a: {job.title}</DialogTitle>
          <DialogDescription>{job.company_name || 'Restaurante'} · {job.location}</DialogDescription>
        </DialogHeader>

        {/* Profile summary */}
        <div className="bg-accent/30 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{profile.full_name}</p>
              <p className="text-xs text-muted-foreground">{profile.headline || 'Sin titular'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Perfil completo:</span>
            <Progress value={profile.profile_completeness || 0} className="h-1.5 flex-1" />
            <span>{profile.profile_completeness}%</span>
          </div>
          {profile.skills && profile.skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {profile.skills.slice(0, 5).map((s, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Carta de presentación (opcional)</Label>
            <Textarea
              placeholder="Cuéntale al empleador por qué eres ideal para este puesto..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={applyToJob.isPending}>
            {applyToJob.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Enviar postulación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApplyDialog;
