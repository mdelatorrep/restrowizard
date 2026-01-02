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
import { useToast } from '@/hooks/use-toast';
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
  Building2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Clients: React.FC = () => {
  const { clients, activeClients, prospects, loading, updateClient, deleteClient } = useConsultantClients();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.business?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'active' && client.status === 'active') ||
                      (activeTab === 'prospects' && client.status === 'prospect') ||
                      (activeTab === 'paused' && client.status === 'paused');
    return matchesSearch && matchesTab;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      active: { variant: 'default', label: 'Activo' },
      prospect: { variant: 'secondary', label: 'Prospecto' },
      paused: { variant: 'outline', label: 'Pausado' },
      churned: { variant: 'destructive', label: 'Perdido' }
    };
    const config = variants[status] || variants.prospect;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-destructive';
  };

  const handleStatusChange = async (clientId: string, newStatus: string) => {
    await updateClient(clientId, { status: newStatus });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
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
          <p className="text-muted-foreground">Gestiona tu portafolio de clientes</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
              <DialogDescription>
                Invita a un restaurante a conectarse contigo como consultor
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Buscar por nombre o email</Label>
                <Input placeholder="nombre@restaurante.com" />
                <p className="text-xs text-muted-foreground">
                  El usuario debe tener una cuenta en RestroWizard
                </p>
              </div>
              <div className="space-y-2">
                <Label>Tarifa mensual (MXN)</Label>
                <Input type="number" placeholder="15000" />
              </div>
              <div className="space-y-2">
                <Label>Servicios incluidos</Label>
                <Input placeholder="Finanzas, Operaciones, Menú" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
              <Button onClick={() => {
                toast({ title: "Invitación enviada", description: "El cliente recibirá una notificación" });
                setIsAddDialogOpen(false);
              }}>
                <Mail className="h-4 w-4 mr-2" />
                Enviar Invitación
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                      {client.business?.cuisine_type === 'italiana' ? '🍝' :
                       client.business?.cuisine_type === 'japonesa' ? '🍣' :
                       client.business?.cuisine_type === 'mexicana' ? '🌮' : '🍽️'}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{client.business?.name || 'Sin nombre'}</CardTitle>
                      <p className="text-sm text-muted-foreground">{client.business?.city || 'Ciudad'}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleStatusChange(client.id, 'active')}>
                        Marcar como Activo
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(client.id, 'paused')}>
                        Pausar Cliente
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => deleteClient(client.id)}
                      >
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex gap-2 mt-2">
                  {getStatusBadge(client.status)}
                  {(client.alerts_count || 0) > 0 && (
                    <Badge variant="destructive">{client.alerts_count} alertas</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Maturity Score */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Madurez</span>
                    <span className={getHealthColor(client.diagnosis?.overall_score || 0)}>
                      {client.diagnosis?.overall_score || 0}%
                    </span>
                  </div>
                  <Progress value={client.diagnosis?.overall_score || 0} className="h-2" />
                </div>

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
                  <Button variant="outline" className="flex-1" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Dashboard
                  </Button>
                  <Button variant="outline" className="flex-1" size="sm">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Mensaje
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Clients;
