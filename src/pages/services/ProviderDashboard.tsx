import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, MessageSquare, Star, Settings, ArrowLeft, Eye } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RequestCard from '@/components/services/RequestCard';
import { useMyProviderProfile } from '@/hooks/useProviderProfile';
import { useServiceRequests } from '@/hooks/useServiceMarketplace';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const ProviderDashboard = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { data: provider, isLoading } = useMyProviderProfile();
  const { data: openRequests = [] } = useServiceRequests({ category: provider?.category, status: 'open' });

  const { data: myProposals = [] } = useQuery({
    queryKey: ['my-proposals', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      const { data, error } = await supabase
        .from('service_proposals')
        .select('*, service_requests(title, status, city, category)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id,
  });

  if (isLoading) return <div className="min-h-screen bg-background"><Header /><div className="pt-28 text-center text-muted-foreground">Cargando...</div></div>;

  if (!provider) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-6 pt-28 pb-12 text-center">
          <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-headline mb-2">No tienes un perfil de proveedor</h2>
          <p className="text-muted-foreground mb-4">Registra tu empresa para acceder al dashboard</p>
          <Button onClick={() => navigate('/services/register')}>Registrar Empresa</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-6 pt-28 pb-12">
        <Button variant="ghost" size="sm" onClick={() => navigate('/services')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Marketplace
        </Button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-headline">{provider.name}</h1>
            <p className="text-muted-foreground text-sm">{provider.headline || provider.specialty}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate(`/services/provider/${provider.id}`)}>
            <Eye className="h-4 w-4 mr-1" /> Ver Perfil Público
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card><CardContent className="pt-4 text-center">
            <p className="text-2xl font-headline text-primary">{openRequests.length}</p>
            <p className="text-xs text-muted-foreground">Solicitudes en tu categoría</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 text-center">
            <p className="text-2xl font-headline text-primary">{myProposals.length}</p>
            <p className="text-xs text-muted-foreground">Propuestas enviadas</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 text-center">
            <p className="text-2xl font-headline text-primary">{provider.completed_projects || 0}</p>
            <p className="text-xs text-muted-foreground">Proyectos completados</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 text-center">
            <p className="text-2xl font-headline text-yellow-500">{provider.average_rating?.toFixed(1) || '-'}</p>
            <p className="text-xs text-muted-foreground">Rating promedio</p>
          </CardContent></Card>
        </div>

        <Tabs defaultValue="requests" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="requests"><MessageSquare className="h-4 w-4 mr-1" /> Solicitudes</TabsTrigger>
            <TabsTrigger value="proposals"><Briefcase className="h-4 w-4 mr-1" /> Propuestas</TabsTrigger>
            <TabsTrigger value="reviews"><Star className="h-4 w-4 mr-1" /> Reseñas</TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <h3 className="font-medium mb-4">Solicitudes abiertas en tu categoría</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {openRequests.map((r: any) => <RequestCard key={r.id} request={r} />)}
            </div>
            {openRequests.length === 0 && <p className="text-sm text-muted-foreground">No hay solicitudes abiertas en tu categoría</p>}
          </TabsContent>

          <TabsContent value="proposals">
            <h3 className="font-medium mb-4">Mis propuestas</h3>
            <div className="space-y-3">
              {myProposals.map((p: any) => (
                <Card key={p.id}>
                  <CardContent className="pt-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{(p.service_requests as any)?.title || 'Solicitud'}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{p.message}</p>
                      <div className="flex gap-2 mt-1">
                        {p.price && <span className="text-xs text-muted-foreground">${p.price.toLocaleString()}</span>}
                        {p.estimated_delivery_days && <span className="text-xs text-muted-foreground">{p.estimated_delivery_days} días</span>}
                      </div>
                    </div>
                    <Badge variant="outline">{p.status}</Badge>
                  </CardContent>
                </Card>
              ))}
              {myProposals.length === 0 && <p className="text-sm text-muted-foreground">No has enviado propuestas aún</p>}
            </div>
          </TabsContent>

          <TabsContent value="reviews">
            <p className="text-sm text-muted-foreground">Las reseñas de tus clientes aparecen en tu perfil público.</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate(`/services/provider/${provider.id}`)}>Ver Reseñas</Button>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default ProviderDashboard;
