import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Image } from 'lucide-react';

const ServicePortfolioManager: React.FC = () => {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-provider-portfolio'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('provider_portfolio')
        .select('*, service_providers(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{items.length} items de portafolio</p>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Imagen</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No hay items de portafolio</TableCell></TableRow>
            ) : items.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell>
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="h-10 w-10 rounded object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center"><Image className="h-4 w-4 text-muted-foreground" /></div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell>{item.service_providers?.name || '—'}</TableCell>
                <TableCell>{item.client_name || '—'}</TableCell>
                <TableCell><Badge variant="outline">{item.category || '—'}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{format(new Date(item.created_at), 'dd MMM yy', { locale: es })}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ServicePortfolioManager;
