import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Users } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const interestLabels: Record<string, string> = {
  investor: 'Inversionista',
  restaurateur: 'Restaurantero',
  entrepreneur: 'Emprendedor',
  curious: 'Explorador',
};

const GrowthAdminPanel: React.FC = () => {
  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ['admin-growth-preregistrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('growth_preregistrations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const exportCSV = () => {
    const header = 'Email,Tipo de Interés,Fecha de Registro\n';
    const rows = registrations.map(r =>
      `${r.email},${interestLabels[r.interest_type] || r.interest_type},${format(new Date(r.created_at), 'dd/MM/yyyy HH:mm')}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `growth-preregistros-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{registrations.length} pre-registrados</span>
          </div>
        </div>
        <Button variant="outline" onClick={exportCSV} disabled={registrations.length === 0}>
          <Download className="h-4 w-4 mr-1" /> Exportar CSV
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Tipo de Interés</TableHead>
              <TableHead>Fecha de Registro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
            ) : registrations.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No hay pre-registros aún</TableCell></TableRow>
            ) : registrations.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.email}</TableCell>
                <TableCell><Badge variant="secondary">{interestLabels[r.interest_type] || r.interest_type}</Badge></TableCell>
                <TableCell>{format(new Date(r.created_at), "dd MMM yyyy, HH:mm", { locale: es })}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default GrowthAdminPanel;
