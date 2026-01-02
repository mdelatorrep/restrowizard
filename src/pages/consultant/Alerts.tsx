import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useConsultantAlerts } from '@/hooks/useConsultantAlerts';
import {
  AlertCircle,
  CheckCircle,
  Search,
  Sparkles,
  Eye,
  Bell,
  TrendingDown,
  Package,
  Users,
  DollarSign,
  Filter
} from 'lucide-react';

const Alerts: React.FC = () => {
  const { alerts, highPriorityAlerts, unreadCount, loading, dismissAlert, markAsRead } = useConsultantAlerts();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.business_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'high' && (alert.priority === 'high' || alert.priority === 'critical')) ||
                      (activeTab === 'unread' && !alert.is_read);
    return matchesSearch && matchesTab;
  });

  const getAlertIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      financial: <DollarSign className="h-5 w-5" />,
      inventory: <Package className="h-5 w-5" />,
      staff: <Users className="h-5 w-5" />,
      operations: <TrendingDown className="h-5 w-5" />
    };
    return icons[type] || <AlertCircle className="h-5 w-5" />;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-destructive text-destructive-foreground',
      high: 'bg-red-500 text-white',
      medium: 'bg-yellow-500 text-white',
      low: 'bg-blue-500 text-white'
    };
    return colors[priority] || colors.medium;
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
            <Bell className="h-8 w-8 text-primary" />
            Centro de Alertas
          </h1>
          <p className="text-muted-foreground">Alertas consolidadas de todos tus clientes</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Alertas</p>
                <p className="text-3xl font-bold">{alerts.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alta Prioridad</p>
                <p className="text-3xl font-bold text-destructive">{highPriorityAlerts.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-destructive opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sin Leer</p>
                <p className="text-3xl font-bold text-blue-500">{unreadCount}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clientes Afectados</p>
                <p className="text-3xl font-bold">
                  {new Set(alerts.map(a => a.user_id)).size}
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar alertas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="high">Alta Prioridad</TabsTrigger>
            <TabsTrigger value="unread">Sin Leer</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {alerts.length === 0 ? '¡Excelente!' : 'No se encontraron alertas'}
            </h3>
            <p className="text-muted-foreground">
              {alerts.length === 0 
                ? 'No hay alertas pendientes en tu portafolio de clientes'
                : 'Intenta con otro término de búsqueda'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <Card 
              key={alert.id} 
              className={`transition-all ${!alert.is_read ? 'border-primary/50 bg-primary/5' : ''}`}
              onClick={() => !alert.is_read && markAsRead(alert.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`p-2 rounded-full ${
                    alert.priority === 'high' || alert.priority === 'critical' 
                      ? 'bg-destructive/10 text-destructive' 
                      : 'bg-yellow-500/10 text-yellow-600'
                  }`}>
                    {getAlertIcon(alert.alert_type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{alert.business_name}</span>
                      <Badge className={getPriorityColor(alert.priority)}>
                        {alert.priority === 'critical' ? 'Crítica' :
                         alert.priority === 'high' ? 'Alta' :
                         alert.priority === 'medium' ? 'Media' : 'Baja'}
                      </Badge>
                      {!alert.is_read && (
                        <Badge variant="outline" className="text-xs">Nueva</Badge>
                      )}
                    </div>
                    <h4 className="font-medium text-foreground">{alert.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(alert.created_at).toLocaleDateString('es-MX', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm">
                      <Sparkles className="h-4 w-4 mr-1" />
                      Solución IA
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissAlert(alert.id);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Resolver
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;
