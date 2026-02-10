import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const EnrollmentsManager: React.FC = () => {
  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ['admin-enrollments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('*, training_courses(title)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{enrollments.length} inscripciones</p>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Curso</TableHead>
              <TableHead>Progreso</TableHead>
              <TableHead>Lecciones</TableHead>
              <TableHead>Vía</TableHead>
              <TableHead>Completado</TableHead>
              <TableHead>Inscripción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
            ) : enrollments.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No hay inscripciones</TableCell></TableRow>
            ) : enrollments.map((e: any) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.training_courses?.title || '—'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 min-w-[100px]">
                    <Progress value={e.progress_percent || 0} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground">{e.progress_percent}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{e.lessons_completed}/{e.total_lessons}</TableCell>
                <TableCell><Badge variant="outline">{e.enrolled_via}</Badge></TableCell>
                <TableCell>
                  {e.completed_at ? (
                    <Badge variant="default">✓ Completado</Badge>
                  ) : (
                    <Badge variant="secondary">En curso</Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{format(new Date(e.created_at), 'dd MMM yy', { locale: es })}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default EnrollmentsManager;
