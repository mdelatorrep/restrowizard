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
import { Plus, Pencil, Trash2, Star, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import AdminFormDialog from './AdminFormDialog';
import type { Database } from '@/integrations/supabase/types';

type ServiceCategory = Database['public']['Enums']['service_category'];

const categoryLabels: Record<ServiceCategory, string> = {
  catering: 'Catering', photography: 'Fotografía', music: 'Música', decoration: 'Decoración',
  lighting: 'Iluminación', entertainment: 'Entretenimiento', flowers: 'Flores', other: 'Otro',
  equipment: 'Equipamiento', technology: 'Tecnología', food_supplies: 'Ingredientes',
  consulting: 'Consultoría', design: 'Diseño',
};

const emptyForm = {
  name: '', description: '', specialty: '', category: 'equipment' as ServiceCategory,
  city: '', country: 'Colombia', contact_email: '', contact_phone: '', website_url: '',
  tags: '', is_active: true, is_verified: false,
};

const ProvidersAdminPanel: React.FC = () => {
  const { userId } = useDataUserId();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['admin-providers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('service_providers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name, description: form.description || null, specialty: form.specialty || null,
        category: form.category, city: form.city, country: form.country,
        contact_email: form.contact_email || null, contact_phone: form.contact_phone || null,
        website_url: form.website_url || null, tags: form.tags ? form.tags.split(',').map(t => t.trim()) : null,
        is_active: form.is_active, is_verified: form.is_verified, owner_id: userId,
      };
      if (editingId) {
        const { error } = await supabase.from('service_providers').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('service_providers').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-providers'] });
      toast.success(editingId ? 'Proveedor actualizado' : 'Proveedor creado');
      setDialogOpen(false);
      resetForm();
    },
    onError: () => toast.error('Error al guardar'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('service_providers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-providers'] }); toast.success('Proveedor eliminado'); },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('service_providers').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-providers'] }),
  });

  const resetForm = () => { setForm(emptyForm); setEditingId(null); };

  const openEdit = (p: typeof providers[0]) => {
    setForm({
      name: p.name, description: p.description || '', specialty: p.specialty || '',
      category: p.category, city: p.city, country: p.country,
      contact_email: p.contact_email || '', contact_phone: p.contact_phone || '',
      website_url: p.website_url || '', tags: p.tags?.join(', ') || '',
      is_active: p.is_active, is_verified: p.is_verified ?? false,
    });
    setEditingId(p.id);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{providers.length} proveedores registrados</p>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Nuevo Proveedor</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Especialidad</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Reseñas</TableHead>
              <TableHead>Verificado</TableHead>
              <TableHead>Activo</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
            ) : providers.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No hay proveedores aún</TableCell></TableRow>
            ) : providers.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{p.specialty || '-'}</TableCell>
                <TableCell><Badge variant="outline">{categoryLabels[p.category]}</Badge></TableCell>
                <TableCell>{p.city}</TableCell>
                <TableCell className="flex items-center gap-1">{p.rating ? <><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{p.rating.toFixed(1)}</> : '-'}</TableCell>
                <TableCell>{p.reviews_count}</TableCell>
                <TableCell>{p.is_verified ? <CheckCircle className="h-4 w-4 text-green-500" /> : '-'}</TableCell>
                <TableCell><Switch checked={p.is_active} onCheckedChange={v => toggleActive.mutate({ id: p.id, is_active: v })} /></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AdminFormDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'} onSubmit={e => { e.preventDefault(); upsertMutation.mutate(); }} isLoading={upsertMutation.isPending}>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Nombre *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></div>
          <div className="space-y-2"><Label>Especialidad</Label><Input value={form.specialty} onChange={e => setForm(p => ({ ...p, specialty: e.target.value }))} /></div>
        </div>
        <div className="space-y-2"><Label>Descripción</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Categoría</Label>
            <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v as ServiceCategory }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Ciudad *</Label><Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} required /></div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>País</Label><Input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Sitio web</Label><Input value={form.website_url} onChange={e => setForm(p => ({ ...p, website_url: e.target.value }))} /></div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Email de contacto</Label><Input type="email" value={form.contact_email} onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Teléfono</Label><Input value={form.contact_phone} onChange={e => setForm(p => ({ ...p, contact_phone: e.target.value }))} /></div>
        </div>
        <div className="space-y-2"><Label>Tags (separados por coma)</Label><Input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="Ej: tecnología, POS, inventario" /></div>
        <div className="flex gap-6">
          <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))} /><Label>Activo</Label></div>
          <div className="flex items-center gap-2"><Switch checked={form.is_verified} onCheckedChange={v => setForm(p => ({ ...p, is_verified: v }))} /><Label>Verificado</Label></div>
        </div>
      </AdminFormDialog>
    </div>
  );
};

export default ProvidersAdminPanel;
