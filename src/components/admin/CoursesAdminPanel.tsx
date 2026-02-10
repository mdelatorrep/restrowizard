import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';
import AdminFormDialog from './AdminFormDialog';
import type { Database } from '@/integrations/supabase/types';

type JobCategory = Database['public']['Enums']['job_category'];
type ExperienceLevel = Database['public']['Enums']['experience_level'];

const categoryLabels: Record<JobCategory, string> = {
  kitchen: 'Cocina', service: 'Servicio', management: 'Gestión', bartender: 'Bartender',
  cleaning: 'Limpieza', delivery: 'Domicilios', other: 'Otro', marketing: 'Marketing',
  finance: 'Finanzas', administration: 'Administración',
};
const levelLabels: Record<ExperienceLevel, string> = {
  entry: 'Básico', junior: 'Junior', mid: 'Intermedio', senior: 'Avanzado', executive: 'Experto',
};

const emptyForm = {
  title: '', description: '', short_description: '', category: 'kitchen' as JobCategory,
  level: 'entry' as ExperienceLevel, duration_hours: '', price: '0', is_free: true,
  is_published: false, video_url: '', thumbnail_url: '',
};

const CoursesAdminPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('training_courses').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title, description: form.description, short_description: form.short_description || null,
        category: form.category, level: form.level, duration_hours: form.duration_hours ? Number(form.duration_hours) : null,
        price: Number(form.price) || 0, is_free: form.is_free, is_published: form.is_published,
        video_url: form.video_url || null, thumbnail_url: form.thumbnail_url || null,
      };
      if (editingId) {
        const { error } = await supabase.from('training_courses').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('training_courses').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      toast.success(editingId ? 'Curso actualizado' : 'Curso creado');
      setDialogOpen(false);
      resetForm();
    },
    onError: () => toast.error('Error al guardar'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('training_courses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-courses'] }); toast.success('Curso eliminado'); },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase.from('training_courses').update({ is_published }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-courses'] }),
  });

  const resetForm = () => { setForm(emptyForm); setEditingId(null); };

  const openEdit = (c: typeof courses[0]) => {
    setForm({
      title: c.title, description: c.description, short_description: c.short_description || '',
      category: c.category, level: c.level, duration_hours: c.duration_hours?.toString() || '',
      price: c.price.toString(), is_free: c.is_free, is_published: c.is_published,
      video_url: c.video_url || '', thumbnail_url: c.thumbnail_url || '',
    });
    setEditingId(c.id);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{courses.length} cursos registrados</p>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Nuevo Curso</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Nivel</TableHead>
              <TableHead>Duración</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Inscritos</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Publicado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
            ) : courses.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No hay cursos aún</TableCell></TableRow>
            ) : courses.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium max-w-[200px] truncate">{c.title}</TableCell>
                <TableCell><Badge variant="outline">{categoryLabels[c.category]}</Badge></TableCell>
                <TableCell>{levelLabels[c.level]}</TableCell>
                <TableCell>{c.duration_hours ? `${c.duration_hours}h` : '-'}</TableCell>
                <TableCell>{c.is_free ? 'Gratis' : `$${c.price.toLocaleString()}`}</TableCell>
                <TableCell>{c.enrollments_count}</TableCell>
                <TableCell className="flex items-center gap-1">{c.average_rating ? <><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{c.average_rating.toFixed(1)}</> : '-'}</TableCell>
                <TableCell><Switch checked={c.is_published} onCheckedChange={v => togglePublish.mutate({ id: c.id, is_published: v })} /></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AdminFormDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editingId ? 'Editar Curso' : 'Nuevo Curso'} onSubmit={e => { e.preventDefault(); upsertMutation.mutate(); }} isLoading={upsertMutation.isPending}>
        <div className="space-y-2"><Label>Título *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required /></div>
        <div className="space-y-2"><Label>Descripción *</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required /></div>
        <div className="space-y-2"><Label>Descripción corta</Label><Input value={form.short_description} onChange={e => setForm(p => ({ ...p, short_description: e.target.value }))} /></div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2"><Label>Categoría</Label>
            <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v as JobCategory }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Nivel</Label>
            <Select value={form.level} onValueChange={v => setForm(p => ({ ...p, level: v as ExperienceLevel }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(levelLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Duración (horas)</Label><Input type="number" value={form.duration_hours} onChange={e => setForm(p => ({ ...p, duration_hours: e.target.value }))} /></div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2"><Switch checked={form.is_free} onCheckedChange={v => setForm(p => ({ ...p, is_free: v, price: v ? '0' : p.price }))} /><Label>Gratuito</Label></div>
          {!form.is_free && <div className="space-y-2"><Label>Precio</Label><Input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} /></div>}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>URL de Video</Label><Input value={form.video_url} onChange={e => setForm(p => ({ ...p, video_url: e.target.value }))} /></div>
          <div className="space-y-2"><Label>URL de Thumbnail</Label><Input value={form.thumbnail_url} onChange={e => setForm(p => ({ ...p, thumbnail_url: e.target.value }))} /></div>
        </div>
        <div className="flex items-center gap-2"><Switch checked={form.is_published} onCheckedChange={v => setForm(p => ({ ...p, is_published: v }))} /><Label>Publicado</Label></div>
      </AdminFormDialog>
    </div>
  );
};

export default CoursesAdminPanel;
