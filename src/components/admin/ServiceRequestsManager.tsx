import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search, FileText } from 'lucide-react';
import { toast } from 'sonner';

const statusLabels: Record<string, string> = {
  open: 'Abierta', in_progress: 'En Progreso', completed: 'Completada', cancelled: 'Cancelada',
};
const urgencyLabels: Record<string, string> = {
  urgent: 'Urgente', normal: 'Normal', flexible: 'Flexible',
};
const statusColors: Record<string, string> = {
  open: 'default', in_progress: 'secondary', completed: 'outline', cancelled: 'destructive',
};

const ServiceRequestsManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['admin-service-requests', statusFilter],
    queryFn: async () => {
      let q = supabase.from('service_requests').select('*').order('created_at', { ascending: false });
      if (statusFilter !== 'all') q = q.eq('status', statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('service_requests').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-service-requests'] });
      toast.success('Estado actualizado');
    },
  });

  const filtered = search
    ? requests.filter((r: any) => r.title?.toLowerCase().includes(search.toLowerCase()))
    : requests;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar solicitudes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="open">Abiertas</SelectItem>
            <SelectItem value="in_progress">En Progreso</SelectItem>
            <SelectItem value="completed">Completadas</SelectItem>
            <SelectItem value="cancelled">Canceladas</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">{filtered.length} solicitudes</p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Urgencia</TableHead>
              <TableHead>Presupuesto</TableHead>
              <TableHead>Propuestas</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No hay solicitudes</TableCell></TableRow>
            ) : filtered.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium max-w-[200px] truncate">{r.title}</TableCell>
                <TableCell><Badge variant="outline">{r.category || '—'}</Badge></TableCell>
                <TableCell>{r.city || '—'}</TableCell>
                <TableCell>
                  <Badge variant={r.urgency === 'urgent' ? 'destructive' : 'secondary'}>
                    {urgencyLabels[r.urgency] || r.urgency}
                  </Badge>
                </TableCell>
                <TableCell>{r.budget_min || r.budget_max ? `$${r.budget_min || 0} - $${r.budget_max || '∞'}` : '—'}</TableCell>
                <TableCell><Badge variant="outline"><FileText className="h-3 w-3 mr-1" />{r.proposals_count || 0}</Badge></TableCell>
                <TableCell>
                  <Select value={r.status} onValueChange={(v) => updateStatus.mutate({ id: r.id, status: v })}>
                    <SelectTrigger className="h-7 text-xs w-[120px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{format(new Date(r.created_at), 'dd MMM yy', { locale: es })}</TableCell>
                <TableCell>—</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ServiceRequestsManager;
