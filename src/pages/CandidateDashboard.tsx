import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCandidateProfile } from '@/hooks/useCandidateProfile';
import { useJobApplications } from '@/hooks/useJobApplications';
import { useSavedJobs } from '@/hooks/useSavedJobs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { FileText, Bookmark, User, Briefcase, Loader2, Plus, Trash2, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import JobCard from '@/components/jobs/JobCard';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  reviewing: { label: 'En revisión', color: 'bg-blue-100 text-blue-800' },
  interview: { label: 'Entrevista', color: 'bg-purple-100 text-purple-800' },
  offer: { label: 'Oferta', color: 'bg-green-100 text-green-800' },
  hired: { label: 'Contratado', color: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-800' },
};

const CandidateDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile, profileLoading, upsertProfile, experience, addExperience, deleteExperience } = useCandidateProfile();
  const { myApplications } = useJobApplications();
  const { savedJobs, toggleSave } = useSavedJobs();

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: '', headline: '', bio: '', phone: '', city: '', country: 'Colombia',
    years_experience: 0, skills: '' as string, certifications: '' as string,
    languages: '' as string, availability: 'immediate',
  });
  const [profileFormInit, setProfileFormInit] = useState(false);

  // Init form from profile data
  React.useEffect(() => {
    if (profile && !profileFormInit) {
      setProfileForm({
        full_name: profile.full_name || '',
        headline: profile.headline || '',
        bio: profile.bio || '',
        phone: profile.phone || '',
        city: profile.city || '',
        country: profile.country || 'Colombia',
        years_experience: profile.years_experience || 0,
        skills: (profile.skills || []).join(', '),
        certifications: (profile.certifications || []).join(', '),
        languages: (profile.languages || []).join(', '),
        availability: profile.availability || 'immediate',
      });
      setProfileFormInit(true);
    }
  }, [profile, profileFormInit]);

  // New experience form
  const [expForm, setExpForm] = useState({ company_name: '', position: '', city: '', description: '', is_current: false });
  const [showExpForm, setShowExpForm] = useState(false);

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleSaveProfile = () => {
    const toArr = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean);
    upsertProfile.mutate({
      full_name: profileForm.full_name,
      headline: profileForm.headline || null,
      bio: profileForm.bio || null,
      phone: profileForm.phone || null,
      city: profileForm.city || null,
      country: profileForm.country || 'Colombia',
      years_experience: profileForm.years_experience,
      skills: toArr(profileForm.skills),
      certifications: toArr(profileForm.certifications),
      languages: toArr(profileForm.languages),
      availability: profileForm.availability,
    });
  };

  const handleAddExp = () => {
    if (!profile?.id || !expForm.company_name || !expForm.position) return;
    addExperience.mutate({
      candidate_id: profile.id,
      company_name: expForm.company_name,
      position: expForm.position,
      city: expForm.city || null,
      description: expForm.description || null,
      is_current: expForm.is_current,
    }, { onSuccess: () => { setShowExpForm(false); setExpForm({ company_name: '', position: '', city: '', description: '', is_current: false }); } });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="pt-24 pb-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button variant="ghost" className="mb-4" onClick={() => navigate('/jobs')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver a empleos
          </Button>
          <h1 className="text-3xl font-bold mb-2">Mi Panel de Candidato</h1>
          <p className="text-muted-foreground mb-6">Gestiona tu perfil, postulaciones y empleos guardados</p>

          <Tabs defaultValue="applications">
            <TabsList className="flex-wrap h-auto mb-6">
              <TabsTrigger value="applications" className="gap-1"><FileText className="h-4 w-4" />Postulaciones</TabsTrigger>
              <TabsTrigger value="saved" className="gap-1"><Bookmark className="h-4 w-4" />Guardados</TabsTrigger>
              <TabsTrigger value="profile" className="gap-1"><User className="h-4 w-4" />Mi Perfil</TabsTrigger>
            </TabsList>

            {/* Applications */}
            <TabsContent value="applications">
              {myApplications.isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : !myApplications.data?.length ? (
                <Card><CardContent className="py-12 text-center">
                  <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Aún no tienes postulaciones</p>
                  <Button className="mt-4" onClick={() => navigate('/jobs')}>Explorar empleos</Button>
                </CardContent></Card>
              ) : (
                <div className="space-y-3">
                  {myApplications.data.map((app: any) => (
                    <Card key={app.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{app.jobs?.title || 'Empleo'}</p>
                          <p className="text-sm text-muted-foreground">{app.jobs?.company_name || 'Restaurante'} · {app.jobs?.location}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Aplicado {formatDistanceToNow(new Date(app.created_at), { addSuffix: true, locale: es })}
                          </p>
                        </div>
                        <Badge className={statusLabels[app.status]?.color || ''}>
                          {statusLabels[app.status]?.label || app.status}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Saved */}
            <TabsContent value="saved">
              {savedJobs.isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : !savedJobs.data?.length ? (
                <Card><CardContent className="py-12 text-center">
                  <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No tienes empleos guardados</p>
                </CardContent></Card>
              ) : (
                <div className="space-y-3">
                  {savedJobs.data.map((saved: any) => saved.jobs && (
                    <JobCard
                      key={saved.id}
                      job={saved.jobs}
                      isSaved={true}
                      onToggleSave={() => toggleSave.mutate(saved.job_id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Profile */}
            <TabsContent value="profile">
              {profileLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : (
                <div className="space-y-6">
                  {profile && (
                    <Card className="bg-accent/20">
                      <CardContent className="p-4 flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">Perfil completo:</span>
                        <Progress value={profile.profile_completeness || 0} className="h-2 flex-1" />
                        <span className="text-sm font-semibold">{profile.profile_completeness}%</span>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader><CardTitle>Datos profesionales</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Nombre completo *</Label>
                          <Input value={profileForm.full_name} onChange={e => setProfileForm(p => ({ ...p, full_name: e.target.value }))} required />
                        </div>
                        <div className="space-y-2"><Label>Titular profesional</Label>
                          <Input placeholder="Ej: Chef con 5 años de experiencia" value={profileForm.headline} onChange={e => setProfileForm(p => ({ ...p, headline: e.target.value }))} />
                        </div>
                      </div>
                      <div className="space-y-2"><Label>Resumen profesional</Label>
                        <Textarea placeholder="Cuéntanos sobre ti..." value={profileForm.bio} onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))} />
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2"><Label>Teléfono</Label>
                          <Input value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} />
                        </div>
                        <div className="space-y-2"><Label>Ciudad</Label>
                          <Input value={profileForm.city} onChange={e => setProfileForm(p => ({ ...p, city: e.target.value }))} />
                        </div>
                        <div className="space-y-2"><Label>Años de experiencia</Label>
                          <Input type="number" value={profileForm.years_experience} onChange={e => setProfileForm(p => ({ ...p, years_experience: parseInt(e.target.value) || 0 }))} />
                        </div>
                      </div>
                      <div className="space-y-2"><Label>Habilidades (separadas por coma)</Label>
                        <Input placeholder="Sushi, Pastelería, POS, Servicio al cliente" value={profileForm.skills} onChange={e => setProfileForm(p => ({ ...p, skills: e.target.value }))} />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Certificaciones (separadas por coma)</Label>
                          <Input placeholder="HACCP, Manipulación de alimentos" value={profileForm.certifications} onChange={e => setProfileForm(p => ({ ...p, certifications: e.target.value }))} />
                        </div>
                        <div className="space-y-2"><Label>Idiomas (separados por coma)</Label>
                          <Input placeholder="Español, Inglés" value={profileForm.languages} onChange={e => setProfileForm(p => ({ ...p, languages: e.target.value }))} />
                        </div>
                      </div>
                      <Button onClick={handleSaveProfile} disabled={upsertProfile.isPending || !profileForm.full_name}>
                        {upsertProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {profile ? 'Actualizar perfil' : 'Crear perfil'}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Experience */}
                  {profile && (
                    <Card>
                      <CardHeader className="flex-row items-center justify-between">
                        <CardTitle>Experiencia laboral</CardTitle>
                        <Button size="sm" variant="outline" onClick={() => setShowExpForm(true)}>
                          <Plus className="h-4 w-4 mr-1" /> Agregar
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {showExpForm && (
                          <Card className="bg-accent/20">
                            <CardContent className="p-4 space-y-3">
                              <div className="grid md:grid-cols-2 gap-3">
                                <div className="space-y-1"><Label className="text-xs">Empresa *</Label>
                                  <Input value={expForm.company_name} onChange={e => setExpForm(p => ({ ...p, company_name: e.target.value }))} />
                                </div>
                                <div className="space-y-1"><Label className="text-xs">Cargo *</Label>
                                  <Input value={expForm.position} onChange={e => setExpForm(p => ({ ...p, position: e.target.value }))} />
                                </div>
                              </div>
                              <div className="space-y-1"><Label className="text-xs">Ciudad</Label>
                                <Input value={expForm.city} onChange={e => setExpForm(p => ({ ...p, city: e.target.value }))} />
                              </div>
                              <div className="space-y-1"><Label className="text-xs">Descripción</Label>
                                <Textarea value={expForm.description} onChange={e => setExpForm(p => ({ ...p, description: e.target.value }))} rows={2} />
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleAddExp} disabled={addExperience.isPending}>Guardar</Button>
                                <Button size="sm" variant="outline" onClick={() => setShowExpForm(false)}>Cancelar</Button>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                        {experience.length === 0 && !showExpForm && (
                          <p className="text-sm text-muted-foreground text-center py-4">Sin experiencia laboral registrada</p>
                        )}
                        {experience.map((exp) => (
                          <div key={exp.id} className="flex items-start justify-between p-3 rounded-lg bg-accent/10">
                            <div>
                              <p className="font-medium text-sm">{exp.position}</p>
                              <p className="text-xs text-muted-foreground">{exp.company_name} {exp.city ? `· ${exp.city}` : ''}</p>
                              {exp.description && <p className="text-xs text-muted-foreground mt-1">{exp.description}</p>}
                              {exp.is_current && <Badge className="text-xs mt-1" variant="secondary">Actual</Badge>}
                            </div>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteExperience.mutate(exp.id)}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default CandidateDashboard;
