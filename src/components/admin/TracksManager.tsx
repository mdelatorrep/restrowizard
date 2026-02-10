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
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import AdminFormDialog from './AdminFormDialog';

const emptyForm = {
  title: '', slug: '', description: '', short_description: '', target_role: '',
  difficulty: 'beginner', estimated_weeks: '', icon_emoji: '🎓',
  is_published: false, is_featured: false, order_index: '0',
};

const TracksManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [coursesDialogOpen, setCoursesDialogOpen] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [newCourseId, setNewCourseId] = useState('');

  const { data: tracks = [], isLoading } = useQuery({
    queryKey: ['admin-tracks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('learning_tracks').select('*').order('order_index');
      if (error) throw error;
      return data;
    },
  });

  const { data: allCourses = [] } = useQuery({
    queryKey: ['admin-all-courses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('training_courses').select('id, title').order('title');
      if (error) throw error;
      return data;
    },
  });

  const { data: trackCourses = [] } = useQuery({
    queryKey: ['admin-track-courses', selectedTrackId],
    enabled: !!selectedTrackId,
    queryFn: async () => {
      const { data, error } = await supabase.from('learning_track_courses').select('*, training_courses(title)').eq('track_id', selectedTrackId!).order('order_index');
      if (error) throw error;
      return data;
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title: form.title, slug: form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: form.description || null, short_description: form.short_description || null,
        target_role: form.target_role || null, difficulty: form.difficulty,
        estimated_weeks: form.estimated_weeks ? Number(form.estimated_weeks) : null,
        icon_emoji: form.icon_emoji || '🎓', is_published: form.is_published, is_featured: form.is_featured,
        order_index: Number(form.order_index) || 0,
      };
      if (editingId) {
        const { error } = await supabase.from('learning_tracks').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('learning_tracks').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tracks'] });
      toast.success(editingId ? 'Ruta actualizada' : 'Ruta creada');
      setDialogOpen(false);
      resetForm();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('learning_tracks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-tracks'] }); toast.success('Ruta eliminada'); },
  });

  const addCourseMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTrackId || !newCourseId) return;
      const { error } = await supabase.from('learning_track_courses').insert({
        track_id: selectedTrackId, course_id: newCourseId, order_index: trackCourses.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-track-courses', selectedTrackId] });
      queryClient.invalidateQueries({ queryKey: ['admin-tracks'] });
      setNewCourseId('');
      toast.success('Curso agregado a la ruta');
    },
  });

  const removeCourseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('learning_track_courses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-track-courses', selectedTrackId] });
      queryClient.invalidateQueries({ queryKey: ['admin-tracks'] });
      toast.success('Curso removido');
    },
  });

  const resetForm = () => { setForm(emptyForm); setEditingId(null); };

  const openEdit = (t: any) => {
    setForm({
      title: t.title, slug: t.slug || '', description: t.description || '',
      short_description: t.short_description || '', target_role: t.target_role || '',
      difficulty: t.difficulty, estimated_weeks: t.estimated_weeks?.toString() || '',
      icon_emoji: t.icon_emoji || '🎓', is_published: t.is_published, is_featured: t.is_featured || false,
      order_index: t.order_index?.toString() || '0',
    });
    setEditingId(t.id);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{tracks.length} rutas registradas</p>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}><Plus className="h-4 w-4 mr-1" />Nueva Ruta</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Emoji</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Nivel</TableHead>
              <TableHead>Cursos</TableHead>
              <TableHead>Semanas</TableHead>
              <TableHead>Publicada</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
            ) : tracks.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No hay rutas</TableCell></TableRow>
            ) : tracks.map((t: any) => (
              <TableRow key={t.id}>
                <TableCell>{t.icon_emoji || '🎓'}</TableCell>
                <TableCell className="font-medium">{t.title}</TableCell>
                <TableCell><Badge variant="outline">{t.difficulty}</Badge></TableCell>
                <TableCell>{t.courses_count}</TableCell>
                <TableCell>{t.estimated_weeks || '-'}</TableCell>
                <TableCell>{t.is_published ? '✓' : '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => { setSelectedTrackId(t.id); setCoursesDialogOpen(true); }}>Cursos</Button>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Track form dialog */}
      <AdminFormDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editingId ? 'Editar Ruta' : 'Nueva Ruta'} onSubmit={e => { e.preventDefault(); upsertMutation.mutate(); }} isLoading={upsertMutation.isPending}>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="space-y-2"><Label>Emoji</Label><Input value={form.icon_emoji} onChange={e => setForm(p => ({ ...p, icon_emoji: e.target.value }))} /></div>
          <div className="col-span-3 space-y-2"><Label>Título *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required /></div>
        </div>
        <div className="space-y-2"><Label>Slug (URL)</Label><Input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="auto-generado" /></div>
        <div className="space-y-2"><Label>Descripción</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Descripción corta</Label><Input value={form.short_description} onChange={e => setForm(p => ({ ...p, short_description: e.target.value }))} /></div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2"><Label>Rol objetivo</Label><Input value={form.target_role} onChange={e => setForm(p => ({ ...p, target_role: e.target.value }))} placeholder="chef, mesero..." /></div>
          <div className="space-y-2"><Label>Nivel</Label>
            <Select value={form.difficulty} onValueChange={v => setForm(p => ({ ...p, difficulty: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Principiante</SelectItem>
                <SelectItem value="intermediate">Intermedio</SelectItem>
                <SelectItem value="advanced">Avanzado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Semanas estimadas</Label><Input type="number" value={form.estimated_weeks} onChange={e => setForm(p => ({ ...p, estimated_weeks: e.target.value }))} /></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2"><Switch checked={form.is_published} onCheckedChange={v => setForm(p => ({ ...p, is_published: v }))} /><Label>Publicada</Label></div>
          <div className="flex items-center gap-2"><Switch checked={form.is_featured} onCheckedChange={v => setForm(p => ({ ...p, is_featured: v }))} /><Label>Destacada</Label></div>
        </div>
      </AdminFormDialog>

      {/* Track courses dialog */}
      <AdminFormDialog open={coursesDialogOpen} onOpenChange={setCoursesDialogOpen} title="Cursos de la Ruta" onSubmit={e => { e.preventDefault(); addCourseMutation.mutate(); }} isLoading={addCourseMutation.isPending}>
        <div className="space-y-3">
          {trackCourses.map((tc: any, i: number) => (
            <div key={tc.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
              <span className="text-sm font-medium w-6">{i + 1}.</span>
              <span className="flex-1 text-sm">{tc.training_courses?.title}</span>
              <Button size="icon" variant="ghost" onClick={() => removeCourseMutation.mutate(tc.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <Select value={newCourseId} onValueChange={setNewCourseId}>
            <SelectTrigger><SelectValue placeholder="Agregar curso..." /></SelectTrigger>
            <SelectContent>
              {allCourses.filter((c: any) => !trackCourses.some((tc: any) => tc.course_id === c.id)).map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </AdminFormDialog>
    </div>
  );
};

export default TracksManager;
