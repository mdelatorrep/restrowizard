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
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import AdminFormDialog from './AdminFormDialog';

const LessonsManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '', description: '', content_type: 'text', content: '', video_url: '',
    duration_minutes: '10', order_index: '0', is_free_preview: false, quiz_data: '',
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['admin-courses-for-lessons'],
    queryFn: async () => {
      const { data, error } = await supabase.from('training_courses').select('id, title').order('title');
      if (error) throw error;
      return data;
    },
  });

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ['admin-lessons', selectedCourseId],
    enabled: !!selectedCourseId,
    queryFn: async () => {
      const { data, error } = await supabase.from('course_lessons').select('*').eq('course_id', selectedCourseId).order('order_index');
      if (error) throw error;
      return data;
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        course_id: selectedCourseId,
        title: form.title,
        description: form.description || null,
        content_type: form.content_type,
        content: form.content || null,
        video_url: form.video_url || null,
        duration_minutes: Number(form.duration_minutes) || 10,
        order_index: Number(form.order_index) || 0,
        is_free_preview: form.is_free_preview,
        quiz_data: form.quiz_data ? JSON.parse(form.quiz_data) : null,
      };
      if (editingId) {
        const { error } = await supabase.from('course_lessons').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('course_lessons').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lessons', selectedCourseId] });
      toast.success(editingId ? 'Lección actualizada' : 'Lección creada');
      setDialogOpen(false);
      resetForm();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('course_lessons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-lessons', selectedCourseId] }); toast.success('Lección eliminada'); },
  });

  const resetForm = () => {
    setForm({ title: '', description: '', content_type: 'text', content: '', video_url: '', duration_minutes: '10', order_index: String(lessons.length), is_free_preview: false, quiz_data: '' });
    setEditingId(null);
  };

  const openEdit = (l: any) => {
    setForm({
      title: l.title, description: l.description || '', content_type: l.content_type,
      content: l.content || '', video_url: l.video_url || '', duration_minutes: String(l.duration_minutes),
      order_index: String(l.order_index), is_free_preview: l.is_free_preview || false,
      quiz_data: l.quiz_data ? JSON.stringify(l.quiz_data, null, 2) : '',
    });
    setEditingId(l.id);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
            <SelectTrigger><SelectValue placeholder="Selecciona un curso" /></SelectTrigger>
            <SelectContent>
              {courses.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {selectedCourseId && (
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}><Plus className="h-4 w-4 mr-1" />Nueva Lección</Button>
        )}
      </div>

      {selectedCourseId && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Preview</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
              ) : lessons.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No hay lecciones</TableCell></TableRow>
              ) : lessons.map((l: any) => (
                <TableRow key={l.id}>
                  <TableCell>{l.order_index + 1}</TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">{l.title}</TableCell>
                  <TableCell><Badge variant="outline">{l.content_type}</Badge></TableCell>
                  <TableCell>{l.duration_minutes} min</TableCell>
                  <TableCell>{l.is_free_preview ? '✓' : '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(l)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(l.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AdminFormDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editingId ? 'Editar Lección' : 'Nueva Lección'} onSubmit={e => { e.preventDefault(); upsertMutation.mutate(); }} isLoading={upsertMutation.isPending}>
        <div className="space-y-2"><Label>Título *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required /></div>
        <div className="space-y-2"><Label>Descripción</Label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2"><Label>Tipo</Label>
            <Select value={form.content_type} onValueChange={v => setForm(p => ({ ...p, content_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Texto</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="ai_interactive">IA Interactiva</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Duración (min)</Label><Input type="number" value={form.duration_minutes} onChange={e => setForm(p => ({ ...p, duration_minutes: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Orden</Label><Input type="number" value={form.order_index} onChange={e => setForm(p => ({ ...p, order_index: e.target.value }))} /></div>
        </div>
        {form.content_type === 'video' && (
          <div className="space-y-2"><Label>URL de Video</Label><Input value={form.video_url} onChange={e => setForm(p => ({ ...p, video_url: e.target.value }))} /></div>
        )}
        <div className="space-y-2"><Label>Contenido (Markdown)</Label><Textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={10} /></div>
        {form.content_type === 'quiz' && (
          <div className="space-y-2"><Label>Quiz Data (JSON)</Label><Textarea value={form.quiz_data} onChange={e => setForm(p => ({ ...p, quiz_data: e.target.value }))} rows={8} placeholder='{"questions":[{"question":"...","options":["a","b","c","d"],"correct":0,"explanation":"..."}]}' /></div>
        )}
        <div className="flex items-center gap-2"><Switch checked={form.is_free_preview} onCheckedChange={v => setForm(p => ({ ...p, is_free_preview: v }))} /><Label>Vista previa gratuita</Label></div>
      </AdminFormDialog>
    </div>
  );
};

export default LessonsManager;
