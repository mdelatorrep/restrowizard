import React, { useState } from 'react';
import { useJobApplications } from '@/hooks/useJobApplications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { User, Mail, Phone, Brain, Star, FileText, Loader2, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { TablesUpdate } from '@/integrations/supabase/types';

const statusColumns = [
  { key: 'pending', label: 'Pendiente', color: 'bg-yellow-500' },
  { key: 'reviewing', label: 'En revisión', color: 'bg-blue-500' },
  { key: 'interview', label: 'Entrevista', color: 'bg-purple-500' },
  { key: 'offer', label: 'Oferta', color: 'bg-green-500' },
  { key: 'hired', label: 'Contratado', color: 'bg-emerald-500' },
  { key: 'rejected', label: 'Rechazado', color: 'bg-red-500' },
];

interface Props {
  jobId: string;
  jobTitle: string;
  onBack: () => void;
}

const JobCandidatesPipeline: React.FC<Props> = ({ jobId, jobTitle, onBack }) => {
  const { getJobApplications, updateApplicationStatus } = useJobApplications();
  const { data: applications = [], isLoading } = getJobApplications(jobId);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [notes, setNotes] = useState('');

  const appsByStatus = statusColumns.map(col => ({
    ...col,
    apps: applications.filter((a: any) => a.status === col.key),
  }));

  // El Select de shadcn emite `string`; el estrechamiento al enum de la BD se
  // hace aquí, en el borde, para que el resto del flujo vaya tipado.
  const handleStatusChange = (appId: string, newStatus: string) => {
    const status = newStatus as TablesUpdate<'job_applications'>['status'];
    updateApplicationStatus.mutate({ id: appId, status });
  };

  const handleSaveNotes = () => {
    if (!selectedApp) return;
    updateApplicationStatus.mutate(
      { id: selectedApp.id, status: selectedApp.status, notes },
      { onSuccess: () => setSelectedApp(null) }
    );
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" />Volver</Button>
        <div>
          <h3 className="font-semibold">Pipeline de candidatos</h3>
          <p className="text-sm text-muted-foreground">{jobTitle} · {applications.length} candidatos</p>
        </div>
      </div>

      {applications.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Aún no hay candidatos para esta oferta</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appsByStatus.filter(col => col.apps.length > 0).map(col => (
            <div key={col.key} className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${col.color}`} />
                <span className="text-sm font-medium">{col.label}</span>
                <Badge variant="secondary" className="text-xs">{col.apps.length}</Badge>
              </div>
              {col.apps.map((app: any) => (
                <Card key={app.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedApp(app); setNotes(app.employer_notes || ''); }}>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{app.applicant_name || 'Candidato'}</p>
                      {app.ai_match_score != null && (
                        <Badge variant={app.ai_match_score >= 70 ? 'default' : 'secondary'} className="text-xs gap-1">
                          <Brain className="h-3 w-3" />{app.ai_match_score}%
                        </Badge>
                      )}
                    </div>
                    {app.applicant_email && <p className="text-xs text-muted-foreground">{app.applicant_email}</p>}
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(app.created_at), { addSuffix: true, locale: es })}
                    </p>
                    <Select value={app.status} onValueChange={(v) => { handleStatusChange(app.id, v); }}>
                      <SelectTrigger className="h-7 text-xs" onClick={(e) => e.stopPropagation()}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusColumns.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Candidate detail sheet */}
      <Sheet open={!!selectedApp} onOpenChange={(o) => !o && setSelectedApp(null)}>
        <SheetContent className="overflow-y-auto">
          {selectedApp && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedApp.applicant_name || 'Candidato'}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                {selectedApp.applicant_email && (
                  <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" />{selectedApp.applicant_email}</div>
                )}
                {selectedApp.applicant_phone && (
                  <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" />{selectedApp.applicant_phone}</div>
                )}

                {selectedApp.ai_match_score != null && (
                  <Card className="bg-accent/20">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Brain className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Match IA: {selectedApp.ai_match_score}%</span>
                      </div>
                      {selectedApp.ai_summary && <p className="text-xs text-muted-foreground">{selectedApp.ai_summary}</p>}
                    </CardContent>
                  </Card>
                )}

                {selectedApp.cover_letter && (
                  <div>
                    <p className="text-sm font-medium mb-1">Carta de presentación</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{selectedApp.cover_letter}</p>
                  </div>
                )}

                {/* Profile info */}
                {selectedApp.candidate_profiles && (
                  <div>
                    <p className="text-sm font-medium mb-2">Perfil del candidato</p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {selectedApp.candidate_profiles.headline && <p>{selectedApp.candidate_profiles.headline}</p>}
                      {selectedApp.candidate_profiles.bio && <p>{selectedApp.candidate_profiles.bio}</p>}
                      {selectedApp.candidate_profiles.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {selectedApp.candidate_profiles.skills.map((s: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      )}
                      {selectedApp.candidate_profiles.years_experience > 0 && (
                        <p>{selectedApp.candidate_profiles.years_experience} años de experiencia</p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium mb-1">Notas del empleador</p>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Escribe notas sobre este candidato..." rows={3} />
                  <Button size="sm" className="mt-2" onClick={handleSaveNotes} disabled={updateApplicationStatus.isPending}>
                    Guardar notas
                  </Button>
                </div>

                <div>
                  <p className="text-sm font-medium mb-1">Cambiar estado</p>
                  <Select value={selectedApp.status} onValueChange={(v) => handleStatusChange(selectedApp.id, v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statusColumns.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default JobCandidatesPipeline;
