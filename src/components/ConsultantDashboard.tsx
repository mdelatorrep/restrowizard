import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useConsultantProfile } from '@/hooks/useConsultantProfile';
import { useConsultantClients } from '@/hooks/useConsultantClients';
import { useConsultantAlerts } from '@/hooks/useConsultantAlerts';
import { useConsultantBilling } from '@/hooks/useConsultantBilling';
import { useActiveClient } from '@/contexts/ActiveClientContext';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Users, Plus } from 'lucide-react';
import { ConsultantKPIs } from '@/components/consultant-dashboard/ConsultantKPIs';
import { InviteClientDialog } from '@/components/consultant-dashboard/InviteClientDialog';
import { ConsultantClientListItem } from '@/components/consultant-dashboard/ConsultantClientListItem';
import { ConsultantAlertsCard } from '@/components/consultant-dashboard/ConsultantAlertsCard';
import { ConsultantPortfolioChart } from '@/components/consultant-dashboard/ConsultantPortfolioChart';
import { ConsultantQuickLinks } from '@/components/consultant-dashboard/ConsultantQuickLinks';

const ConsultantDashboard = () => {
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useConsultantProfile();
  const { activeClients, totalMonthlyRevenue, loading: clientsLoading } = useConsultantClients();
  const { alerts, highPriorityAlerts, loading: alertsLoading } = useConsultantAlerts();
  const { totalPending, loading: billingLoading } = useConsultantBilling();
  const { setActiveClient } = useActiveClient();

  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const isLoading = profileLoading || clientsLoading || alertsLoading || billingLoading;
  const inviteLink = profile?.id ? `${window.location.origin}/auth?ref=${profile.id}` : '';

  const handleWorkWithClient = (client: any, path: string) => {
    setActiveClient(client);
    navigate(path);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const hasClients = activeClients.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile?.logo_url || '/placeholder.svg'} />
            <AvatarFallback>{profile?.company_name?.slice(0, 2).toUpperCase() || 'CO'}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Briefcase className="h-7 w-7 text-primary" />
              Vista General
            </h2>
            <p className="text-muted-foreground">
              {profile?.company_name || 'Mi Consultoría'} • {activeClients.length} clientes activos
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <InviteClientDialog
            inviteLink={inviteLink}
            open={showInviteDialog}
            onOpenChange={setShowInviteDialog}
          />
        </div>
      </div>

      <ConsultantKPIs
        activeClientsCount={activeClients.length}
        totalMonthlyRevenue={totalMonthlyRevenue}
        highPriorityAlertsCount={highPriorityAlerts.length}
        totalPending={totalPending}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Mis Clientes</CardTitle>
                <CardDescription>Selecciona un cliente para trabajar con las herramientas IA</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {!hasClients ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tienes clientes activos</h3>
                  <p className="text-muted-foreground mb-4">
                    Invita a tu primer cliente para comenzar a usar las herramientas IA
                  </p>
                  <Button onClick={() => setShowInviteDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Invitar Cliente
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {(activeClients || []).map((client) => (
                    <ConsultantClientListItem
                      key={client.id}
                      client={client}
                      onWorkWith={handleWorkWithClient}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {hasClients && <ConsultantPortfolioChart activeClients={activeClients} />}
          <ConsultantAlertsCard alerts={alerts} />
          <ConsultantQuickLinks />
        </div>
      </div>
    </div>
  );
};

export default ConsultantDashboard;
