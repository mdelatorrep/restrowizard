import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search, DollarSign } from 'lucide-react';

const statusLabels: Record<string, string> = {
  pending: 'Pendiente', accepted: 'Aceptada', rejected: 'Rechazada', withdrawn: 'Retirada',
};

const ServiceProposalsManager: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ['admin-service-proposals', statusFilter],
    queryFn: async () => {
      let q = supabase.from('service_proposals')
        .select('*, service_providers(name), service_requests(title)')
        .order('created_at', { ascending: false });
      if (statusFilter !== 'all') q = q.eq('status', statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const filtered = search
    ? proposals.filter((p: any) => p.message?.toLowerCase().includes(search.toLowerCase()) || (p as any).service_providers?.name?.toLowerCase().includes(search.toLowerCase()))
    : proposals;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar propuestas..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="accepted">Aceptadas</SelectItem>
            <SelectItem value="rejected">Rechazadas</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">{filtered.length} propuestas</p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proveedor</TableHead>
              <TableHead>Solicitud</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Días est.</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No hay propuestas</TableCell></TableRow>
            ) : filtered.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.service_providers?.name || '—'}</TableCell>
                <TableCell className="max-w-[200px] truncate">{p.service_requests?.title || '—'}</TableCell>
                <TableCell>{p.price ? <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{Number(p.price).toLocaleString()}</span> : '—'}</TableCell>
                <TableCell>{p.estimated_delivery_days || '—'}</TableCell>
                <TableCell>
                  <Badge variant={p.status === 'accepted' ? 'default' : p.status === 'rejected' ? 'destructive' : 'secondary'}>
                    {statusLabels[p.status] || p.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{format(new Date(p.created_at), 'dd MMM yy', { locale: es })}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ServiceProposalsManager;
