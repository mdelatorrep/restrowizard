import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Award } from 'lucide-react';

const CertificatesManager: React.FC = () => {
  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ['admin-certificates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_certificates')
        .select('*, training_courses(title)')
        .order('issued_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Award className="h-4 w-4 text-primary" />
        <p className="text-sm text-muted-foreground">{certificates.length} certificados emitidos</p>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Curso</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Fecha de Emisión</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
            ) : certificates.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No hay certificados</TableCell></TableRow>
            ) : certificates.map((c: any) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-sm">{c.certificate_number}</TableCell>
                <TableCell className="font-medium">{c.training_courses?.title || '—'}</TableCell>
                <TableCell><Badge variant="outline">{c.certificate_type === 'course' ? 'Curso' : 'Ruta'}</Badge></TableCell>
                <TableCell className="text-sm">{format(new Date(c.issued_at), 'dd MMM yyyy', { locale: es })}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CertificatesManager;
