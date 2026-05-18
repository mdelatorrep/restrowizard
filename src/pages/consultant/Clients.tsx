import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useConsultantClients } from '@/hooks/useConsultantClients';
import { useActiveClient } from '@/contexts/ActiveClientContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Building2 } from 'lucide-react';
import { ClientsKPIs } from '@/components/consultant/ClientsKPIs';
import { CreateClientDialog } from '@/components/consultant/CreateClientDialog';
import { ConsultantClientCard } from '@/components/consultant/ConsultantClientCard';
import { SendInvitationDialog } from '@/components/consultant/SendInvitationDialog';

const Clients: React.FC = () => {
  const {
    clients, activeClients, prospects, pendingClients,
    loading, createClient, sendInvitation, getInvitationLink,
    updateClient, deleteClient,
  } = useConsultantClients();
  const { setActiveClient } = useActiveClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const filteredClients = (clients || []).filter(client => {
    const clientName = client.business?.name || client.restaurant_name || '';
    const matchesSearch = clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.restaurant_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' ||
      (activeTab === 'active' && client.status === 'active') ||
      (activeTab === 'prospects' && client.status === 'prospect') ||
      (activeTab === 'pending' && !client.client_user_id) ||
      (activeTab === 'paused' && client.status === 'paused');
    return matchesSearch && matchesTab;
  });

  const handleCopyInviteLink = (client: any) => {
    const link = getInvitationLink(client);
    if (link) {
      navigator.clipboard.writeText(link);
      toast({ title: 'Link copiado', description: 'El link de invitación ha sido copiado al portapapeles' });
    }
  };

  const handleSendInvitation = async () => {
    if (selectedClient && selectedClient.restaurant_email) {
      await sendInvitation(selectedClient.id, selectedClient.restaurant_email);
      setIsInviteDialogOpen(false);
      setSelectedClient(null);
    }
  };

  const handleWorkWithClient = (client: any) => {
    setActiveClient(client as any);
    navigate('/c/finances');
  };

  const handleStatusChange = async (clientId: string, newStatus: string) => {
    await updateClient(clientId, { status: newStatus });
  };

  const handleOpenInvite = (client: any) => {
    setSelectedClient(client);
    setIsInviteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Mis Clientes
          </h1>
          <p className="text-muted-foreground">Gestiona tu portafolio de restaurantes</p>
        </div>
        <CreateClientDialog onCreate={createClient} />
      </div>

      <ClientsKPIs
        total={(clients || []).length}
        active={(activeClients || []).length}
        prospects={(prospects || []).length}
        pending={(pendingClients || []).length}
        withAlerts={(clients || []).filter(c => (c.alerts_count || 0) > 0).length}
      />

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="active">Activos</TabsTrigger>
            <TabsTrigger value="prospects">Prospectos</TabsTrigger>
            <TabsTrigger value="pending">Sin vincular</TabsTrigger>
            <TabsTrigger value="paused">Pausados</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredClients.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {(clients || []).length === 0 ? 'No tienes clientes aún' : 'No se encontraron clientes'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {(clients || []).length === 0
                ? 'Agrega tu primer cliente para comenzar a gestionar su negocio'
                : 'Intenta con otro término de búsqueda'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map(client => (
            <ConsultantClientCard
              key={client.id}
              client={client}
              onWorkWith={handleWorkWithClient}
              onCopyInvite={handleCopyInviteLink}
              onOpenInvite={handleOpenInvite}
              onStatusChange={handleStatusChange}
              onDelete={deleteClient}
            />
          ))}
        </div>
      )}

      <SendInvitationDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        client={selectedClient}
        setClient={setSelectedClient}
        getInvitationLink={getInvitationLink}
        onCopyInvite={handleCopyInviteLink}
        onSend={handleSendInvitation}
      />
    </div>
  );
};

export default Clients;
