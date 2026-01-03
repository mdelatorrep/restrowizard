import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useConsultantProfile } from '@/hooks/useConsultantProfile';
import { useConsultantClients } from '@/hooks/useConsultantClients';
import { useConsultantAlerts } from '@/hooks/useConsultantAlerts';
import { useConsultantBilling } from '@/hooks/useConsultantBilling';
import { useActiveClient } from '@/contexts/ActiveClientContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
  Briefcase,
  Users,
  DollarSign,
  AlertCircle,
  Plus,
  Eye,
  Copy,
  Check,
  Link2,
  ArrowRight,
  Sparkles,
  ChefHat,
  Leaf,
  Utensils,
  TrendingUp
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const ConsultantDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, loading: profileLoading } = useConsultantProfile();
  const { clients, activeClients, totalMonthlyRevenue, loading: clientsLoading } = useConsultantClients();
  const { alerts, highPriorityAlerts, loading: alertsLoading } = useConsultantAlerts();
  const { totalPending, loading: billingLoading } = useConsultantBilling();
  const { setActiveClient } = useActiveClient();
  
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const isLoading = profileLoading || clientsLoading || alertsLoading || billingLoading;

  // Generate invitation link for the consultant
  const inviteLink = profile?.id 
    ? `${window.location.origin}/auth?ref=${profile.id}`
    : '';

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setInviteLinkCopied(true);
    toast({ title: "Link copiado", description: "El link de invitación ha sido copiado al portapapeles" });
    setTimeout(() => setInviteLinkCopied(false), 2000);
  };

  const getHealthColor = (health: number) => {
    if (health >= 80) return 'text-green-500';
    if (health >= 60) return 'text-yellow-500';
    return 'text-destructive';
  };

  const getHealthBadge = (health: number) => {
    if (health >= 80) return <Badge className="bg-green-500">Saludable</Badge>;
    if (health >= 60) return <Badge className="bg-yellow-500">Atención</Badge>;
    return <Badge variant="destructive">Crítico</Badge>;
  };

  // Chart data from real clients
  const clientComparisonData = {
    labels: activeClients.slice(0, 6).map(c => c.business?.name?.substring(0, 10) || 'Cliente'),
    datasets: [
      {
        label: 'Puntuación Madurez',
        data: activeClients.slice(0, 6).map(c => c.diagnosis?.overall_score || 0),
        backgroundColor: 'hsl(var(--chart-1))'
      }
    ]
  };

  // Handle selecting a client and navigating to an AI tool
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
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Invitar Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  Invitar Nuevo Cliente
                </DialogTitle>
                <DialogDescription>
                  Comparte este enlace con tu cliente para que se registre y quede vinculado automáticamente a tu consultoría.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input 
                    value={inviteLink} 
                    readOnly 
                    className="flex-1 font-mono text-sm"
                  />
                  <Button onClick={copyInviteLink} variant="outline">
                    {inviteLinkCopied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">¿Cómo funciona?</h4>
                  <ol className="text-sm text-muted-foreground space-y-1">
                    <li>1. Copia el link de invitación</li>
                    <li>2. Envíalo a tu cliente por email o WhatsApp</li>
                    <li>3. El cliente se registra usando el link</li>
                    <li>4. Automáticamente aparecerá en tu lista de clientes</li>
                  </ol>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clientes Activos</p>
                <p className="text-3xl font-bold">{activeClients.length}</p>
              </div>
              <Users className="h-10 w-10 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ingresos Mensuales</p>
                <p className="text-3xl font-bold">${(totalMonthlyRevenue / 1000).toFixed(0)}k</p>
              </div>
              <DollarSign className="h-10 w-10 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alertas Pendientes</p>
                <p className="text-3xl font-bold text-destructive">{highPriorityAlerts.length}</p>
              </div>
              <AlertCircle className="h-10 w-10 text-destructive opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Por Cobrar</p>
                <p className="text-3xl font-bold">${(totalPending / 1000).toFixed(0)}k</p>
              </div>
              <TrendingUp className="h-10 w-10 text-yellow-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clients List */}
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
                  {activeClients.map((client) => (
                    <div 
                      key={client.id} 
                      className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                            🍽️
                          </div>
                          <div>
                            <h4 className="font-semibold">{client.business?.name || 'Cliente'}</h4>
                            <p className="text-sm text-muted-foreground">
                              {client.business?.city || 'Sin ubicación'}
                              {client.business?.cuisine_type && ` · ${client.business.cuisine_type}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getHealthBadge(client.diagnosis?.overall_score || 0)}
                          {(client.alerts_count || 0) > 0 && (
                            <Badge variant="destructive">{client.alerts_count} alertas</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Puntuación Madurez</span>
                          <span className={getHealthColor(client.diagnosis?.overall_score || 0)}>
                            {client.diagnosis?.overall_score || 0}%
                          </span>
                        </div>
                        <Progress value={client.diagnosis?.overall_score || 0} className="h-2" />
                      </div>

                      {/* Quick Actions - Navigate to AI tools with this client */}
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleWorkWithClient(client, '/c/finances')}
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          Finanzas
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleWorkWithClient(client, '/c/operations')}
                        >
                          <ChefHat className="h-4 w-4 mr-1" />
                          Operaciones
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleWorkWithClient(client, '/c/talent')}
                        >
                          <Users className="h-4 w-4 mr-1" />
                          Talento
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleWorkWithClient(client, '/c/menu-engineering')}
                        >
                          <Utensils className="h-4 w-4 mr-1" />
                          Menú
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleWorkWithClient(client, '/c/sustainability')}
                        >
                          <Leaf className="h-4 w-4 mr-1" />
                          Sostenibilidad
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Maturity Chart */}
          {hasClients && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Madurez del Portafolio</CardTitle>
              </CardHeader>
              <CardContent>
                <Bar 
                  data={clientComparisonData}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { max: 100 } }
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Recent Alerts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Alertas Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm">Sin alertas pendientes</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.slice(0, 4).map((alert) => (
                    <div key={alert.id} className="flex items-start gap-2 p-2 rounded border">
                      <div className={`h-2 w-2 rounded-full mt-2 ${
                        alert.priority === 'high' || alert.priority === 'critical' ? 'bg-destructive' : 'bg-yellow-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{alert.business_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{alert.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardContent className="pt-4 space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-between" 
                onClick={() => navigate('/c/billing')}
              >
                <span className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Facturación
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-between" 
                onClick={() => navigate('/c/settings')}
              >
                <span className="flex items-center">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Configuración
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ConsultantDashboard;
