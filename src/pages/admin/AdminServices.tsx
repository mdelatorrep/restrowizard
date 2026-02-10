import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminServices: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: providers, isLoading } = useQuery({
    queryKey: ['admin-all-providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const { data: requests } = useQuery({
    queryKey: ['admin-all-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const { data: proposals } = useQuery({
    queryKey: ['admin-all-proposals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_proposals')
        .select('*, service_requests(title)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ['admin-all-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('provider_reviews')
        .select('*, service_providers(company_name)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const toggleVerification = useMutation({
    mutationFn: async ({ id, verified }: { id: string; verified: boolean }) => {
      const { error } = await supabase
        .from('service_providers')
        .update({ is_verified: !verified })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-providers'] });
      toast({ title: 'Verificación actualizada' });
    },
  });

  const urgencyBadge = (urgency: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-destructive/10 text-destructive border-destructive/30',
      normal: 'bg-blue-500/10 text-blue-600 border-blue-300',
      flexible: 'bg-muted text-muted-foreground',
    };
    return <Badge variant="outline" className={colors[urgency] || ''}>{urgency}</Badge>;
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-3xl font-headline font-bold text-foreground">RestroServices</h1>
        <p className="text-muted-foreground">Gestión global del marketplace de servicios</p>
      </div>

      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="providers">Proveedores ({providers?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="requests">Solicitudes ({requests?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="proposals">Propuestas ({proposals?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="reviews">Reseñas ({reviews?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="providers">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Especialidad</TableHead>
                      <TableHead>Ciudad</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Verificado</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {providers?.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-muted-foreground">{p.specialty || '—'}</TableCell>
                        <TableCell className="text-muted-foreground">{p.city || '—'}</TableCell>
                        <TableCell>
                          {p.average_rating ? (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                              {p.average_rating}
                            </div>
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          {p.is_verified ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600">✓</Badge>
                          ) : (
                            <Badge variant="outline">No</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleVerification.mutate({ id: p.id, verified: p.is_verified || false })}
                          >
                            {p.is_verified ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Presupuesto</TableHead>
                    <TableHead>Urgencia</TableHead>
                    <TableHead>Propuestas</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests?.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.title}</TableCell>
                      <TableCell className="text-muted-foreground">{r.category || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.budget_min || r.budget_max
                          ? `$${(r.budget_min || 0).toLocaleString()} - $${(r.budget_max || 0).toLocaleString()}`
                          : '—'}
                      </TableCell>
                      <TableCell>{urgencyBadge(r.urgency || 'normal')}</TableCell>
                      <TableCell>{r.proposals_count || 0}</TableCell>
                      <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proposals">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Solicitud</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Días estimados</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposals?.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{(p.service_requests as any)?.title || '—'}</TableCell>
                      <TableCell>${p.price?.toLocaleString() || '—'}</TableCell>
                      <TableCell>{p.estimated_delivery_days || '—'}</TableCell>
                      <TableCell><Badge variant="outline">{p.status}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString('es')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Comentario</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews?.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{(r.service_providers as any)?.company_name || '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          {r.rating}/5
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[300px] truncate">{r.comment || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString('es')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminServices;
