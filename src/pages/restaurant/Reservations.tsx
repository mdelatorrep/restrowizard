import { useState } from 'react';
import { useReservations, Reservation } from '@/hooks/useReservations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAIAgent } from '@/hooks/useAIAgent';
import { AIInsightsPanel } from '@/components/AIInsightsPanel';
import { ReservationKPICards } from '@/components/reservations/ReservationKPICards';
import { ReservationCalendarView } from '@/components/reservations/ReservationCalendarView';
import { ReservationTimelineView } from '@/components/reservations/ReservationTimelineView';
import { 
  Calendar, Clock, Users, Phone, Mail, CheckCircle, XCircle, 
  AlertCircle, Loader2, Plus, Search, Filter, Sparkles,
  LayoutGrid, CalendarDays, List, QrCode, Link2, Copy
} from 'lucide-react';
import { format, isToday, isTomorrow, parseISO, startOfWeek, endOfWeek, isWithinInterval, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: <AlertCircle className="h-4 w-4" /> },
  confirmed: { label: 'Confirmada', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: <CheckCircle className="h-4 w-4" /> },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800 border-red-200', icon: <XCircle className="h-4 w-4" /> },
  completed: { label: 'Completada', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: <CheckCircle className="h-4 w-4" /> },
  no_show: { label: 'No asistió', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: <XCircle className="h-4 w-4" /> },
};

function CreateReservationDialog({ onCreate }: { onCreate: (data: any) => Promise<Reservation | null> }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    party_size: 2,
    reservation_date: '',
    reservation_time: '',
    special_requests: '',
    source: 'phone',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await onCreate({
      ...form,
      party_size: Number(form.party_size),
    });
    setLoading(false);
    if (result) {
      setOpen(false);
      setForm({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        party_size: 2,
        reservation_date: '',
        reservation_time: '',
        special_requests: '',
        source: 'phone',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shadow-lg">
          <Plus className="h-4 w-4 mr-2" />
          Nueva reserva
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crear reserva manual</DialogTitle>
          <DialogDescription>Registra una reserva hecha por teléfono o en persona</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre del cliente *</Label>
            <Input
              required
              value={form.customer_name}
              onChange={e => setForm(prev => ({ ...prev, customer_name: e.target.value }))}
              placeholder="Nombre completo"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Teléfono *</Label>
              <Input
                required
                value={form.customer_phone}
                onChange={e => setForm(prev => ({ ...prev, customer_phone: e.target.value }))}
                placeholder="+57 300..."
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.customer_email}
                onChange={e => setForm(prev => ({ ...prev, customer_email: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Fecha *</Label>
              <Input
                type="date"
                required
                value={form.reservation_date}
                onChange={e => setForm(prev => ({ ...prev, reservation_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Hora *</Label>
              <Input
                type="time"
                required
                value={form.reservation_time}
                onChange={e => setForm(prev => ({ ...prev, reservation_time: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Personas *</Label>
              <Input
                type="number"
                required
                min={1}
                value={form.party_size}
                onChange={e => setForm(prev => ({ ...prev, party_size: parseInt(e.target.value) }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fuente</Label>
            <Select value={form.source} onValueChange={v => setForm(prev => ({ ...prev, source: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">Teléfono</SelectItem>
                <SelectItem value="walk_in">En persona</SelectItem>
                <SelectItem value="website">Sitio web</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              value={form.special_requests}
              onChange={e => setForm(prev => ({ ...prev, special_requests: e.target.value }))}
              rows={2}
              placeholder="Peticiones especiales, alergias..."
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Crear reserva
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ShareReservationsDialog() {
  const { toast } = useToast();
  const reservationUrl = `${window.location.origin}/restaurante/mi-restaurante#reservas`;
  
  const copyLink = () => {
    navigator.clipboard.writeText(reservationUrl);
    toast({ title: "Enlace copiado", description: "El enlace de reservas ha sido copiado" });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Link2 className="h-4 w-4 mr-2" />
          Compartir reservas
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compartir sistema de reservas</DialogTitle>
          <DialogDescription>
            Comparte el enlace de tu sitio web para que los clientes puedan reservar
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input value={reservationUrl} readOnly className="flex-1" />
            <Button variant="outline" onClick={copyLink}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Configura tu sitio web público en <strong>Sitio Web</strong> para habilitar las reservas online
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ReservationsPage() {
  const { reservations, kpis, loading, updateReservationStatus, createReservation } = useReservations();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar' | 'list'>('timeline');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  
  const { predictNoShows, loading: aiLoading } = useAIAgent();

  const filteredReservations = reservations.filter(r => {
    const matchesSearch = r.customer_name.toLowerCase().includes(search.toLowerCase()) ||
                          r.customer_phone.includes(search) ||
                          r.confirmation_code.includes(search.toUpperCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const todayReservations = filteredReservations.filter(r => r.reservation_date === todayStr);
  const upcomingReservations = filteredReservations.filter(r => r.reservation_date >= todayStr);
  const pastReservations = filteredReservations.filter(r => r.reservation_date < todayStr);

  const handleAnalyzeNoShows = async () => {
    const reservationData = {
      reservations: reservations.map(r => ({
        customerName: r.customer_name,
        date: r.reservation_date,
        time: r.reservation_time,
        partySize: r.party_size,
        status: r.status,
        source: r.source
      })),
      kpis: kpis,
      noShowHistory: reservations.filter(r => r.status === 'no_show').length,
      totalReservations: reservations.length
    };
    
    const result = await predictNoShows(reservationData);
    if (result) setAiInsights(result);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-6 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Reservaciones</h1>
            <p className="text-white/80 mt-1">Gestiona las reservas de tu restaurante con IA</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="secondary" 
              className="bg-white/20 hover:bg-white/30 text-white border-0"
              onClick={handleAnalyzeNoShows} 
              disabled={aiLoading || reservations.length === 0}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {aiLoading ? 'Analizando...' : 'Predecir No-Shows'}
            </Button>
            <ShareReservationsDialog />
            <CreateReservationDialog onCreate={createReservation} />
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <AIInsightsPanel
        title="Predicción de No-Shows IA"
        description="Identifica reservaciones en riesgo y estrategias de confirmación"
        insights={aiInsights}
        loading={aiLoading}
        onAnalyze={handleAnalyzeNoShows}
      />

      {/* KPIs */}
      <ReservationKPICards kpis={kpis} reservations={reservations} />

      {/* View Controls */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-1 gap-4">
              <div className="flex-1 relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, teléfono o código..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="confirmed">Confirmadas</SelectItem>
                  <SelectItem value="completed">Completadas</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                  <SelectItem value="no_show">No asistió</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
              <Button
                variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('timeline')}
              >
                <List className="h-4 w-4 mr-2" />
                Timeline
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('calendar')}
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                Calendario
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Lista
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      {viewMode === 'timeline' && (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center gap-2 mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(addDays(selectedDate, -1))}
              >
                Anterior
              </Button>
              <Button
                variant={isToday(selectedDate) ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDate(new Date())}
              >
                Hoy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              >
                Siguiente
              </Button>
            </div>
            <ReservationTimelineView
              reservations={filteredReservations}
              onUpdateStatus={updateReservationStatus}
              date={selectedDate}
            />
          </CardContent>
        </Card>
      )}

      {viewMode === 'calendar' && (
        <ReservationCalendarView
          reservations={filteredReservations}
          onUpdateStatus={updateReservationStatus}
        />
      )}

      {viewMode === 'list' && (
        <Tabs defaultValue="today" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today">
              Hoy ({todayReservations.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Próximas ({upcomingReservations.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Pasadas ({pastReservations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today">
            {todayReservations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay reservas para hoy</h3>
                  <p className="text-muted-foreground">Las reservas aparecerán aquí cuando los clientes las hagan</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todayReservations.map(r => (
                  <ReservationCard key={r.id} reservation={r} onUpdateStatus={updateReservationStatus} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming">
            {upcomingReservations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay reservas próximas</h3>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingReservations.map(r => (
                  <ReservationCard key={r.id} reservation={r} onUpdateStatus={updateReservationStatus} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {pastReservations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay reservas pasadas</h3>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastReservations.map(r => (
                  <ReservationCard key={r.id} reservation={r} onUpdateStatus={updateReservationStatus} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function ReservationCard({ 
  reservation, 
  onUpdateStatus 
}: { 
  reservation: Reservation; 
  onUpdateStatus: (id: string, status: Reservation['status']) => void;
}) {
  const status = STATUS_CONFIG[reservation.status];
  const date = parseISO(reservation.reservation_date);
  
  const getDateLabel = () => {
    if (isToday(date)) return 'Hoy';
    if (isTomorrow(date)) return 'Mañana';
    return format(date, 'EEEE d MMM', { locale: es });
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden group">
      <div className={`h-1 ${reservation.status === 'confirmed' ? 'bg-emerald-500' : reservation.status === 'pending' ? 'bg-amber-500' : 'bg-gray-300'}`} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-lg">{reservation.customer_name}</h3>
            <p className="text-sm text-muted-foreground">
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">
                {reservation.confirmation_code}
              </span>
            </p>
          </div>
          <Badge className={status.color} variant="outline">
            {status.icon}
            <span className="ml-1">{status.label}</span>
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="capitalize">{getDateLabel()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{reservation.reservation_time.slice(0, 5)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{reservation.party_size} personas</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{reservation.customer_phone}</span>
          </div>
        </div>

        {reservation.special_requests && (
          <p className="text-sm bg-muted/50 p-2 rounded mb-4 italic">
            "{reservation.special_requests}"
          </p>
        )}
        
        {reservation.status === 'pending' && (
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={() => onUpdateStatus(reservation.id, 'confirmed')}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Confirmar
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onUpdateStatus(reservation.id, 'cancelled')}
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          </div>
        )}
        
        {reservation.status === 'confirmed' && (
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={() => onUpdateStatus(reservation.id, 'completed')}
              className="flex-1"
            >
              Marcar completada
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onUpdateStatus(reservation.id, 'no_show')}
              className="flex-1"
            >
              No asistió
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
