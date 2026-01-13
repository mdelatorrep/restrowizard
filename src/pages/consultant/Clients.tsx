import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useConsultantClients } from '@/hooks/useConsultantClients';
import { useActiveClient } from '@/contexts/ActiveClientContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Eye,
  MessageSquare,
  MoreVertical,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Mail,
  DollarSign,
  Calendar,
  Building2,
  Link2,
  Copy,
  UserCheck,
  Clock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Clients: React.FC = () => {
  const { 
    clients, 
    activeClients, 
    prospects, 
    pendingClients,
    loading, 
    createClient,
    sendInvitation,
    getInvitationLink,
    updateClient, 
    deleteClient 
  } = useConsultantClients();
  const { setActiveClient } = useActiveClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  
  // Form state for new client
  const [newClient, setNewClient] = useState({
    restaurant_name: '',
    restaurant_city: '',
    restaurant_cuisine_type: '',
    restaurant_email: '',
    restaurant_phone: '',
    monthly_fee: '',
    services_included: ''
  });

  const filteredClients = clients.filter(client => {
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

  const getStatusBadge = (client: any) => {
    if (client.claimed_at) {
      return <Badge variant="default" className="bg-green-500"><UserCheck className="h-3 w-3 mr-1" />Vinculado</Badge>;
    }
    if (client.invitation_sent_at && !client.client_user_id) {
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Invitación enviada</Badge>;
    }
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      active: { variant: 'default', label: 'Activo' },
      prospect: { variant: 'secondary', label: 'Prospecto' },
      paused: { variant: 'outline', label: 'Pausado' },
      churned: { variant: 'destructive', label: 'Perdido' }
    };
    const config = variants[client.status] || variants.prospect;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-destructive';
  };

  const handleCreateClient = async () => {
    if (!newClient.restaurant_name.trim()) {
      toast({ title: "Error", description: "El nombre del restaurante es requerido", variant: "destructive" });
      return;
    }

    await createClient({
      restaurant_name: newClient.restaurant_name,
      restaurant_city: newClient.restaurant_city,
      restaurant_cuisine_type: newClient.restaurant_cuisine_type,
      restaurant_email: newClient.restaurant_email,
      restaurant_phone: newClient.restaurant_phone,
      monthly_fee: newClient.monthly_fee ? parseFloat(newClient.monthly_fee) : undefined,
      services_included: newClient.services_included ? newClient.services_included.split(',').map(s => s.trim()) : undefined
    });

    setNewClient({
      restaurant_name: '',
      restaurant_city: '',
      restaurant_cuisine_type: '',
      restaurant_email: '',
      restaurant_phone: '',
      monthly_fee: '',
      services_included: ''
    });
    setIsAddDialogOpen(false);
  };

  const handleCopyInviteLink = (client: any) => {
    const link = getInvitationLink(client);
    if (link) {
      navigator.clipboard.writeText(link);
      toast({ title: "Link copiado", description: "El link de invitación ha sido copiado al portapapeles" });
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
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Mis Clientes
          </h1>
          <p className="text-muted-foreground">Gestiona tu portafolio de restaurantes</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
              <DialogDescription>
                Crea un perfil para tu cliente. Podrás invitarlo a vincularse después.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nombre del Restaurante *</Label>
                <Input 
                  placeholder="Ej: Tacos Don Pepe"
                  value={newClient.restaurant_name}
                  onChange={(e) => setNewClient(prev => ({ ...prev, restaurant_name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ciudad</Label>
                  <Input 
                    placeholder="Ej: CDMX"
                    value={newClient.restaurant_city}
                    onChange={(e) => setNewClient(prev => ({ ...prev, restaurant_city: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Cocina</Label>
                  <Select 
                    value={newClient.restaurant_cuisine_type}
                    onValueChange={(value) => setNewClient(prev => ({ ...prev, restaurant_cuisine_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mexicana">Mexicana</SelectItem>
                      <SelectItem value="italiana">Italiana</SelectItem>
                      <SelectItem value="japonesa">Japonesa</SelectItem>
                      <SelectItem value="china">China</SelectItem>
                      <SelectItem value="americana">Americana</SelectItem>
                      <SelectItem value="fusion">Fusión</SelectItem>
                      <SelectItem value="otra">Otra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email (opcional)</Label>
                  <Input 
                    type="email"
                    placeholder="contacto@restaurante.com"
                    value={newClient.restaurant_email}
                    onChange={(e) => setNewClient(prev => ({ ...prev, restaurant_email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input 
                    placeholder="55 1234 5678"
                    value={newClient.restaurant_phone}
                    onChange={(e) => setNewClient(prev => ({ ...prev, restaurant_phone: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tarifa Mensual (MXN)</Label>
                <Input 
                  type="number"
                  placeholder="15000"
                  value={newClient.monthly_fee}
                  onChange={(e) => setNewClient(prev => ({ ...prev, monthly_fee: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Servicios incluidos</Label>
                <Input 
                  placeholder="Finanzas, Operaciones, Menú"
                  value={newClient.services_included}
                  onChange={(e) => setNewClient(prev => ({ ...prev, services_included: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Separa los servicios con comas</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateClient}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Cliente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Clientes</p>
                <p className="text-3xl font-bold">{clients.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Activos</p>
                <p className="text-3xl font-bold text-green-500">{activeClients.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Prospectos</p>
                <p className="text-3xl font-bold text-blue-500">{prospects.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-3xl font-bold text-amber-500">{pendingClients.length}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Con Alertas</p>
                <p className="text-3xl font-bold text-destructive">
                  {clients.filter(c => (c.alerts_count || 0) > 0).length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-destructive opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
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

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {clients.length === 0 ? 'No tienes clientes aún' : 'No se encontraron clientes'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {clients.length === 0 
                ? 'Agrega tu primer cliente para comenzar a gestionar su negocio'
                : 'Intenta con otro término de búsqueda'}
            </p>
            {clients.length === 0 && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Cliente
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <Card key={client.id} className={client.status === 'paused' ? 'opacity-70' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                      {(client.business?.cuisine_type || client.restaurant_cuisine_type) === 'italiana' ? '🍝' :
                       (client.business?.cuisine_type || client.restaurant_cuisine_type) === 'japonesa' ? '🍣' :
                       (client.business?.cuisine_type || client.restaurant_cuisine_type) === 'mexicana' ? '🌮' :
                       (client.business?.cuisine_type || client.restaurant_cuisine_type) === 'china' ? '🥡' : '🍽️'}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{client.business?.name || client.restaurant_name || 'Sin nombre'}</CardTitle>
                      <p className="text-sm text-muted-foreground">{client.business?.city || client.restaurant_city || 'Ciudad'}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleWorkWithClient(client)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Trabajar con cliente
                      </DropdownMenuItem>
                      {!client.client_user_id && (
                        <>
                          <DropdownMenuItem onClick={() => handleCopyInviteLink(client)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar link de invitación
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedClient(client);
                            setIsInviteDialogOpen(true);
                          }}>
                            <Mail className="h-4 w-4 mr-2" />
                            Enviar invitación
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleStatusChange(client.id, 'active')}>
                        Marcar como Activo
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(client.id, 'paused')}>
                        Pausar Cliente
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => deleteClient(client.id)}
                      >
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {getStatusBadge(client)}
                  {(client.alerts_count || 0) > 0 && (
                    <Badge variant="destructive">{client.alerts_count} alertas</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Maturity Score - only for claimed clients */}
                {client.diagnosis && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Madurez</span>
                      <span className={getHealthColor(client.diagnosis.overall_score)}>
                        {client.diagnosis.overall_score}%
                      </span>
                    </div>
                    <Progress value={client.diagnosis.overall_score} className="h-2" />
                  </div>
                )}

                {/* Contact info for pending clients */}
                {!client.client_user_id && client.restaurant_email && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {client.restaurant_email}
                  </div>
                )}

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>${(client.monthly_fee || 0).toLocaleString()}/mes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{client.start_date ? new Date(client.start_date).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' }) : 'Sin fecha'}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    size="sm"
                    onClick={() => handleWorkWithClient(client)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Dashboard
                  </Button>
                  {!client.client_user_id ? (
                    <Button 
                      variant="outline" 
                      className="flex-1" 
                      size="sm"
                      onClick={() => handleCopyInviteLink(client)}
                    >
                      <Link2 className="h-4 w-4 mr-1" />
                      Invitar
                    </Button>
                  ) : (
                    <Button variant="outline" className="flex-1" size="sm">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Mensaje
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Send Invitation Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Invitación</DialogTitle>
            <DialogDescription>
              Envía una invitación al restaurante para que se vincule a tu cuenta
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email del restaurante</Label>
              <Input 
                type="email"
                placeholder="contacto@restaurante.com"
                value={selectedClient?.restaurant_email || ''}
                onChange={(e) => setSelectedClient((prev: any) => prev ? { ...prev, restaurant_email: e.target.value } : null)}
              />
            </div>
            {selectedClient && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Link de invitación:</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs flex-1 truncate">
                    {getInvitationLink(selectedClient)}
                  </code>
                  <Button size="sm" variant="ghost" onClick={() => handleCopyInviteLink(selectedClient)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSendInvitation} disabled={!selectedClient?.restaurant_email}>
              <Mail className="h-4 w-4 mr-2" />
              Enviar Invitación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Clients;
