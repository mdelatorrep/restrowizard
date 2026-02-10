import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ServiceReviewsManager: React.FC = () => {
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['admin-provider-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('provider_reviews')
        .select('*, service_providers(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const renderStars = (rating: number | null) => {
    if (!rating) return '—';
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`h-3 w-3 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{reviews.length} reseñas de proveedores</p>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proveedor</TableHead>
              <TableHead>General</TableHead>
              <TableHead>Calidad</TableHead>
              <TableHead>Puntualidad</TableHead>
              <TableHead>Comunicación</TableHead>
              <TableHead>Comentario</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
            ) : reviews.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No hay reseñas</TableCell></TableRow>
            ) : reviews.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.service_providers?.name || '—'}</TableCell>
                <TableCell>{renderStars(r.rating)}</TableCell>
                <TableCell>{renderStars(r.quality_rating)}</TableCell>
                <TableCell>{renderStars(r.punctuality_rating)}</TableCell>
                <TableCell>{renderStars(r.communication_rating)}</TableCell>
                <TableCell className="max-w-[200px] truncate">{r.comment || '—'}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{format(new Date(r.created_at), 'dd MMM yy', { locale: es })}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ServiceReviewsManager;
