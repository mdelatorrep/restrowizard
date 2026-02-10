import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Star } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const CourseReviewsManager: React.FC = () => {
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['admin-course-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_reviews')
        .select('*, training_courses(title)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3 w-3 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{reviews.length} reseñas de cursos</p>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Curso</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Comentario</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
            ) : reviews.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No hay reseñas</TableCell></TableRow>
            ) : reviews.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.training_courses?.title || '—'}</TableCell>
                <TableCell>{renderStars(r.rating)}</TableCell>
                <TableCell className="max-w-[300px] truncate">{r.comment || '—'}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{format(new Date(r.created_at), 'dd MMM yy', { locale: es })}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CourseReviewsManager;
