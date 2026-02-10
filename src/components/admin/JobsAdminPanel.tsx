import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from '@/hooks/useDataUserId';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import AdminFormDialog from './AdminFormDialog';
import type { Database } from '@/integrations/supabase/types';

type JobCategory = Database['public']['Enums']['job_category'];
type JobType = Database['public']['Enums']['job_type'];
type ExperienceLevel = Database['public']['Enums']['experience_level'];

const categoryLabels: Record<JobCategory, string> = {
  kitchen: 'Cocina', service: 'Servicio', management: 'Gestión', bartender: 'Bartender',
  cleaning: 'Limpieza', delivery: 'Domicilios', other: 'Otro', marketing: 'Marketing',
  finance: 'Finanzas', administration: 'Administración',
};
const jobTypeLabels: Record<JobType, string> = {
  full_time: 'Tiempo completo', part_time: 'Medio tiempo', contract: 'Contrato',
  temporary: 'Temporal', internship: 'Pasantía',
};
const levelLabels: Record<ExperienceLevel, string> = {
  entry: 'Entrada', junior: 'Junior', mid: 'Intermedio', senior: 'Senior', executive: 'Ejecutivo',
};

const emptyForm = {
  title: '', description: '', category: 'kitchen' as JobCategory, location: '',
  job_type: 'full_time' as JobType, experience_level: 'entry' as ExperienceLevel,
  salary_min: '', salary_max: '', benefits: '', requirements: '', is_active: true,
};

const JobsAdminPanel: React.FC = () => {
  const { userId } = useDataUserId();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['admin-jobs', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('jobs').select('*').eq('employer_id', userId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title, description: form.description, category: form.category,
        location: form.location, job_type: form.job_type, experience_level: form.experience_level,
        salary_min: form.salary_min ? Number(form.salary_min) : null,
        salary_max: form.salary_max ? Number(form.salary_max) : null,
        benefits: form.benefits || null, requirements: form.requirements || null,
        is_active: form.is_active, employer_id: userId!,
      };
      if (editingId) {
        const { error } = await supabase.from('jobs').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('jobs').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
      toast.success(editingId ? 'Empleo actualizado' : 'Empleo creado');
      setDialogOpen(false);
      resetForm();
    },
    onError: () => toast.error('Error al guardar'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('jobs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-jobs'] }); toast.success('Empleo eliminado'); },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('jobs').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-jobs'] }); },
  });

  const resetForm = () => { setForm(emptyForm); setEditingId(null); };

  const openEdit = (job: typeof jobs[0]) => {
    setForm({
      title: job.title, description: job.description, category: job.category,
      location: job.location, job_type: job.job_type, experience_level: job.experience_level,
      salary_min: job.salary_min?.toString() || '', salary_max: job.salary_max?.toString() || '',
      benefits: job.benefits || '', requirements: job.requirements || '', is_active: job.is_active,
    });
    setEditingId(job.id);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{jobs.length} empleos registrados</p>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Nuevo Empleo</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Candidatos</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
            ) : jobs.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No hay empleos aún</TableCell></TableRow>
            ) : jobs.map(job => (
              <TableRow key={job.id}>
                <TableCell className="font-medium">{job.title}</TableCell>
                <TableCell><Badge variant="outline">{categoryLabels[job.category]}</Badge></TableCell>
                <TableCell>{job.location}</TableCell>
                <TableCell>{jobTypeLabels[job.job_type]}</TableCell>
                <TableCell>{job.applications_count}</TableCell>
                <TableCell>
                  <Switch checked={job.is_active} onCheckedChange={(v) => toggleMutation.mutate({ id: job.id, is_active: v })} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(job)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(job.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AdminFormDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editingId ? 'Editar Empleo' : 'Nuevo Empleo'} onSubmit={(e) => { e.preventDefault(); upsertMutation.mutate(); }} isLoading={upsertMutation.isPending}>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Título *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required /></div>
          <div className="space-y-2"><Label>Ubicación *</Label><Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} required /></div>
        </div>
        <div className="space-y-2"><Label>Descripción *</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required /></div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2"><Label>Categoría</Label>
            <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v as JobCategory }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Tipo</Label>
            <Select value={form.job_type} onValueChange={v => setForm(p => ({ ...p, job_type: v as JobType }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(jobTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Nivel</Label>
            <Select value={form.experience_level} onValueChange={v => setForm(p => ({ ...p, experience_level: v as ExperienceLevel }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(levelLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Salario mínimo</Label><Input type="number" value={form.salary_min} onChange={e => setForm(p => ({ ...p, salary_min: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Salario máximo</Label><Input type="number" value={form.salary_max} onChange={e => setForm(p => ({ ...p, salary_max: e.target.value }))} /></div>
        </div>
        <div className="space-y-2"><Label>Requisitos</Label><Textarea value={form.requirements} onChange={e => setForm(p => ({ ...p, requirements: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Beneficios</Label><Textarea value={form.benefits} onChange={e => setForm(p => ({ ...p, benefits: e.target.value }))} /></div>
        <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))} /><Label>Activo</Label></div>
      </AdminFormDialog>
    </div>
  );
};

export default JobsAdminPanel;
