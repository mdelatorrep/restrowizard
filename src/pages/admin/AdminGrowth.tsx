import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Rocket } from 'lucide-react';

const AdminGrowth: React.FC = () => {
  const { data: preregistrations, isLoading } = useQuery({
    queryKey: ['admin-all-preregistrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('growth_preregistrations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-3xl font-headline font-bold text-foreground">RestroGrowth</h1>
        <p className="text-muted-foreground">Pre-registros e interés en la plataforma de inversión</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : preregistrations && preregistrations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Tipo de interés</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preregistrations.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.email}</TableCell>
                    <TableCell><Badge variant="outline">{p.interest_type || '—'}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString('es')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Rocket className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">Sin pre-registros aún</p>
              <p className="text-sm">Los pre-registros de RestroGrowth aparecerán aquí</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminGrowth;
