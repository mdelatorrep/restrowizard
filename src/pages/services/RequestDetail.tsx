import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, DollarSign, AlertTriangle, ArrowLeft, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProposalDialog from '@/components/services/ProposalDialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useServiceProposals } from '@/hooks/useServiceMarketplace';
import { useMyProviderProfile } from '@/hooks/useProviderProfile';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const urgencyConfig: Record<string, { label: string; color: string }> = {
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-700' },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-700' },
  flexible: { label: 'Flexible', color: 'bg-green-100 text-green-700' },
};

const categoryLabels: Record<string, string> = {
  equipment: 'Equipamiento', technology: 'Tecnología', food_supplies: 'Ingredientes',
  consulting: 'Consultoría', design: 'Diseño', catering: 'Catering',
  photography: 'Fotografía', other: 'Otro',
};

const RequestDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [proposalOpen, setProposalOpen] = useState(false);
  const { data: myProvider } = useMyProviderProfile();

  const { data: request, isLoading } = useQuery({
    queryKey: ['service-request-detail', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from('service_requests').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: proposals = [] } = useServiceProposals(id);
  const isOwner = session?.user?.id === request?.user_id;
  const urgency = urgencyConfig[request?.urgency || 'normal'];

  if (isLoading) return <div className="min-h-screen bg-background"><Header /><div className="pt-28 text-center text-muted-foreground">Cargando...</div></div>;
  if (!request) return <div className="min-h-screen bg-background"><Header /><div className="pt-28 text-center text-muted-foreground">Solicitud no encontrada</div></div>;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-6 pt-28 pb-12">
        <Button variant="ghost" size="sm" onClick={() => navigate('/services')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver al marketplace
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline">{categoryLabels[request.category] || request.category}</Badge>
                  <Badge className={`${urgency.color} border-0`}>
                    {request.urgency === 'urgent' && <AlertTriangle className="h-3 w-3 mr-0.5" />}
                    {urgency.label}
                  </Badge>
                  <Badge variant="outline">{request.status}</Badge>
                </div>

                <h1 className="text-2xl font-headline mb-2">{request.title}</h1>
                {request.description && <p className="text-muted-foreground whitespace-pre-line">{request.description}</p>}

                <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                  {request.city && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{request.city}</span>}
                  {(request.budget_min || request.budget_max) && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {request.budget_min && request.budget_max
                        ? `$${request.budget_min.toLocaleString()} - $${request.budget_max.toLocaleString()}`
                        : request.budget_max ? `Hasta $${request.budget_max.toLocaleString()}` : `Desde $${request.budget_min?.toLocaleString()}`
                      }
                    </span>
                  )}
                  {request.deadline && (
                    <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{format(new Date(request.deadline), 'dd MMM yyyy', { locale: es })}</span>
                  )}
                </div>

                {request.requirements?.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <h3 className="text-sm font-medium mb-2">Requisitos</h3>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {request.requirements.map((r: string, i: number) => <li key={i}>{r}</li>)}
                    </ul>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Proposals - visible only to request owner */}
            {isOwner && (
              <Card>
                <CardHeader>
                  <CardTitle>Propuestas Recibidas ({proposals.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {proposals.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay propuestas</p>}
                  {proposals.map((p: any) => (
                    <div key={p.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{p.service_providers?.name || 'Proveedor'}</span>
                          {p.service_providers?.is_verified && <Badge className="bg-green-100 text-green-700 border-0 text-[10px]">Verificado</Badge>}
                        </div>
                        <Badge variant="outline">{p.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{p.message}</p>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        {p.price && <span><DollarSign className="h-3 w-3 inline" />${p.price.toLocaleString()}</span>}
                        {p.estimated_delivery_days && <span>{p.estimated_delivery_days} días</span>}
                      </div>
                      {p.status === 'pending' && (
                        <div className="flex gap-2 mt-3">
                          <Button size="sm">Aceptar</Button>
                          <Button size="sm" variant="outline">Rechazar</Button>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-3 text-center">
                <MessageSquare className="h-8 w-8 mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">{request.proposals_count || 0} propuestas recibidas</p>
                {myProvider && !isOwner && request.status === 'open' && (
                  <Button className="w-full" onClick={() => setProposalOpen(true)}>Enviar Propuesta</Button>
                )}
                {!session && <Button className="w-full" variant="outline" onClick={() => navigate('/auth')}>Inicia sesión para proponer</Button>}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-xs text-muted-foreground space-y-1">
                <p>Publicado: {format(new Date(request.created_at), 'dd MMM yyyy', { locale: es })}</p>
                <p>Estado: {request.status}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
      {myProvider && id && (
        <ProposalDialog open={proposalOpen} onOpenChange={setProposalOpen} requestId={id} providerId={myProvider.id} />
      )}
    </div>
  );
};

export default RequestDetail;
