import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Calendar,
  Plus,
  Search,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Building2,
  Users,
  Eye,
  MoreHorizontal,
  Copy,
  Trash2,
  ExternalLink,
  MapPin,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuotations, Quotation } from '@/hooks/useQuotations';
import { useRestaurantZones } from '@/hooks/useRestaurantZones';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Borrador', color: 'bg-muted text-muted-foreground', icon: FileText },
  sent: { label: 'Enviada', color: 'bg-blue-500/10 text-blue-600', icon: Send },
  viewed: { label: 'Vista', color: 'bg-purple-500/10 text-purple-600', icon: Eye },
  negotiating: { label: 'Negociando', color: 'bg-amber-500/10 text-amber-600', icon: Clock },
  accepted: { label: 'Aceptada', color: 'bg-emerald-500/10 text-emerald-600', icon: CheckCircle },
  rejected: { label: 'Rechazada', color: 'bg-destructive/10 text-destructive', icon: XCircle },
  expired: { label: 'Expirada', color: 'bg-muted text-muted-foreground', icon: Clock },
};

const eventTypeLabels: Record<string, string> = {
  corporativo: 'Corporativo',
  social: 'Social',
  boda: 'Boda',
  cumpleaños: 'Cumpleaños',
  conferencia: 'Conferencia',
  otro: 'Otro',
};

export default function ConsultantEvents() {
  const navigate = useNavigate();
  const { quotations, loading, stats, updateQuotationStatus, deleteQuotation } = useQuotations();
  const { zones, loading: zonesLoading } = useRestaurantZones();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredQuotations = quotations.filter((q) => {
    const matchesSearch =
      q.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.client_contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.client_company?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/cotizacion/${slug}`;
    navigator.clipboard.writeText(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  if (loading || zonesLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">
            Eventos y Cotizaciones
          </h1>
          <p className="text-muted-foreground">
            Gestiona propuestas para tus clientes corporativos y particulares
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/c/events/spaces')}>
            <MapPin className="mr-2 h-4 w-4" />
            Gestionar Espacios
          </Button>
          <Button onClick={() => navigate('/c/events/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Cotización
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Cotizaciones
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.drafts} borradores, {stats.sent} enviadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tasa de Conversión
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.accepted} aceptadas de {stats.sent + stats.accepted + stats.rejected} enviadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Aceptado
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
            <p className="text-xs text-muted-foreground">En eventos confirmados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Espacios Disponibles
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{zones.filter((z) => z.is_active).length}</div>
            <p className="text-xs text-muted-foreground">{zones.length} espacios totales</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Mis Cotizaciones</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">Todas ({quotations.length})</TabsTrigger>
              <TabsTrigger value="draft">Borradores ({stats.drafts})</TabsTrigger>
              <TabsTrigger value="sent">Enviadas ({stats.sent})</TabsTrigger>
              <TabsTrigger value="accepted">Aceptadas ({stats.accepted})</TabsTrigger>
            </TabsList>

            <TabsContent value={statusFilter} className="space-y-4">
              {filteredQuotations.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No hay cotizaciones</h3>
                  <p className="text-muted-foreground">
                    Crea tu primera cotización para comenzar
                  </p>
                  <Button className="mt-4" onClick={() => navigate('/c/events/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Cotización
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredQuotations.map((quotation) => (
                    <QuotationCard
                      key={quotation.id}
                      quotation={quotation}
                      onStatusChange={updateQuotationStatus}
                      onDelete={deleteQuotation}
                      onCopyLink={handleCopyLink}
                      formatCurrency={formatCurrency}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

interface QuotationCardProps {
  quotation: Quotation;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onCopyLink: (slug: string) => void;
  formatCurrency: (amount: number) => string;
}

function QuotationCard({
  quotation,
  onStatusChange,
  onDelete,
  onCopyLink,
  formatCurrency,
}: QuotationCardProps) {
  const navigate = useNavigate();
  const status = statusConfig[quotation.status] || statusConfig.draft;
  const StatusIcon = status.icon;

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Calendar className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">{quotation.event_name}</h3>
            <Badge className={status.color}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {status.label}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {quotation.client_contact_name}
              {quotation.client_company && ` - ${quotation.client_company}`}
            </span>
            {quotation.event_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(quotation.event_date), 'dd MMM yyyy', { locale: es })}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {quotation.guest_count} personas
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden md:block">
          <div className="font-medium">{formatCurrency(quotation.total_amount)}</div>
          <div className="text-xs text-muted-foreground">
            {eventTypeLabels[quotation.event_type] || quotation.event_type}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/c/events/${quotation.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver Detalles
            </DropdownMenuItem>
            {quotation.public_slug && (
              <>
                <DropdownMenuItem onClick={() => onCopyLink(quotation.public_slug!)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar Enlace
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => window.open(`/cotizacion/${quotation.public_slug}`, '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ver Propuesta
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            {quotation.status === 'draft' && (
              <DropdownMenuItem onClick={() => onStatusChange(quotation.id, 'sent')}>
                <Send className="mr-2 h-4 w-4" />
                Marcar como Enviada
              </DropdownMenuItem>
            )}
            {quotation.status === 'sent' && (
              <>
                <DropdownMenuItem onClick={() => onStatusChange(quotation.id, 'accepted')}>
                  <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" />
                  Marcar como Aceptada
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange(quotation.id, 'rejected')}>
                  <XCircle className="mr-2 h-4 w-4 text-destructive" />
                  Marcar como Rechazada
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(quotation.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
