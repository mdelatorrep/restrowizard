import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupportTickets, SupportTicket } from '@/hooks/useSupportTickets';
import { useToast } from '@/hooks/use-toast';
import { 
  Headphones, Plus, Loader2, Clock, AlertTriangle, CheckCircle,
  MessageSquare, User, Mail, Phone, Sparkles, Send
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const typeConfig: Record<string, { label: string; color: string }> = {
  peticion: { label: 'Petición', color: 'bg-blue-100 text-blue-800' },
  queja: { label: 'Queja', color: 'bg-orange-100 text-orange-800' },
  reclamo: { label: 'Reclamo', color: 'bg-red-100 text-red-800' },
  sugerencia: { label: 'Sugerencia', color: 'bg-green-100 text-green-800' },
  felicitacion: { label: 'Felicitación', color: 'bg-purple-100 text-purple-800' },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Baja', color: 'bg-gray-100 text-gray-800' },
  medium: { label: 'Media', color: 'bg-yellow-100 text-yellow-800' },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  open: { label: 'Abierto', color: 'bg-blue-100 text-blue-800', icon: MessageSquare },
  in_progress: { label: 'En Proceso', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  pending_customer: { label: 'Esperando Cliente', color: 'bg-orange-100 text-orange-800', icon: User },
  resolved: { label: 'Resuelto', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  closed: { label: 'Cerrado', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
};

const TicketCard = ({ ticket, onClick }: { ticket: SupportTicket; onClick: () => void }) => {
  const status = statusConfig[ticket.status || 'open'];
  const StatusIcon = status.icon;
  const type = typeConfig[ticket.type] || typeConfig.peticion;
  const priority = priorityConfig[ticket.priority || 'medium'];

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge className={type.color}>{type.label}</Badge>
            <Badge className={priority.color}>{priority.label}</Badge>
          </div>
          <Badge className={status.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
        </div>
        <h3 className="font-semibold mb-1">#{ticket.ticket_number} - {ticket.subject}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{ticket.description}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{ticket.customer_name || 'Sin nombre'}</span>
          <span>{format(new Date(ticket.created_at!), 'PPp', { locale: es })}</span>
        </div>
      </CardContent>
    </Card>
  );
};

const Support = () => {
  const { tickets, templates, kpis, loading, hasData, createTicket, updateTicket, addMessage } = useSupportTickets();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [ticketMessages, setTicketMessages] = useState<Array<{ id: string; sender_type: string; message: string; created_at: string }>>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [ticketForm, setTicketForm] = useState({
    type: 'peticion',
    priority: 'medium',
    subject: '',
    description: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
  });

  const handleCreateTicket = async () => {
    if (!ticketForm.subject.trim() || !ticketForm.description.trim()) {
      toast({ title: 'Error', description: 'Asunto y descripción son requeridos', variant: 'destructive' });
      return;
    }
    await createTicket(ticketForm);
    setShowCreateDialog(false);
    setTicketForm({
      type: 'peticion',
      priority: 'medium',
      subject: '',
      description: '',
      customer_name: '',
      customer_email: '',
      customer_phone: '',
    });
  };

  const handleSelectTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setTicketMessages([]);
  };

  const handleSendMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return;
    await addMessage(selectedTicket.id, newMessage);
    setNewMessage('');
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedTicket) return;
    await updateTicket(selectedTicket.id, { status });
    setSelectedTicket({ ...selectedTicket, status });
  };

  const filteredTickets = tickets.filter(t => {
    if (filterStatus === 'all') return true;
    return t.status === filterStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Soporte - PQRS</h1>
          <p className="text-muted-foreground">Gestiona peticiones, quejas, reclamos y sugerencias</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Crear Ticket de Soporte</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Tipo</Label>
                  <Select
                    value={ticketForm.type}
                    onValueChange={(value) => setTicketForm({ ...ticketForm, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="peticion">Petición</SelectItem>
                      <SelectItem value="queja">Queja</SelectItem>
                      <SelectItem value="reclamo">Reclamo</SelectItem>
                      <SelectItem value="sugerencia">Sugerencia</SelectItem>
                      <SelectItem value="felicitacion">Felicitación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Prioridad</Label>
                  <Select
                    value={ticketForm.priority}
                    onValueChange={(value) => setTicketForm({ ...ticketForm, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Asunto *</Label>
                <Input
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                  placeholder="Resumen del ticket"
                />
              </div>
              <div className="grid gap-2">
                <Label>Descripción *</Label>
                <Textarea
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                  placeholder="Detalle del problema o solicitud"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="grid gap-2">
                  <Label>Cliente</Label>
                  <Input
                    value={ticketForm.customer_name}
                    onChange={(e) => setTicketForm({ ...ticketForm, customer_name: e.target.value })}
                    placeholder="Nombre"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={ticketForm.customer_email}
                    onChange={(e) => setTicketForm({ ...ticketForm, customer_email: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Teléfono</Label>
                  <Input
                    value={ticketForm.customer_phone}
                    onChange={(e) => setTicketForm({ ...ticketForm, customer_phone: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
              <Button onClick={handleCreateTicket}>Crear Ticket</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tickets</p>
                <p className="text-3xl font-bold">{kpis?.totalTickets || 0}</p>
              </div>
              <Headphones className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Abiertos</p>
                <p className="text-3xl font-bold text-blue-600">{kpis?.openTickets || 0}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Urgentes</p>
                <p className="text-3xl font-bold text-red-600">{kpis?.urgentTickets || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En Proceso</p>
                <p className="text-3xl font-bold text-green-600">{kpis?.inProgressTickets || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="open">Abiertos</SelectItem>
                <SelectItem value="in_progress">En Proceso</SelectItem>
                <SelectItem value="pending_customer">Esperando Cliente</SelectItem>
                <SelectItem value="resolved">Resueltos</SelectItem>
                <SelectItem value="closed">Cerrados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!hasData ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Headphones className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Sin tickets</h3>
                <p className="text-muted-foreground text-center mb-4 text-sm">
                  Los tickets de soporte aparecerán aquí
                </p>
                <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Crear Ticket
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredTickets.map(ticket => (
                <TicketCard 
                  key={ticket.id} 
                  ticket={ticket} 
                  onClick={() => handleSelectTicket(ticket)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Ticket Detail */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>#{selectedTicket.ticket_number} - {selectedTicket.subject}</CardTitle>
                    <CardDescription>
                      {format(new Date(selectedTicket.created_at!), 'PPpp', { locale: es })}
                    </CardDescription>
                  </div>
                  <Select
                    value={selectedTicket.status || 'open'}
                    onValueChange={handleUpdateStatus}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Abierto</SelectItem>
                      <SelectItem value="in_progress">En Proceso</SelectItem>
                      <SelectItem value="pending_customer">Esperando Cliente</SelectItem>
                      <SelectItem value="resolved">Resuelto</SelectItem>
                      <SelectItem value="closed">Cerrado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-2">
                  <Badge className={typeConfig[selectedTicket.type]?.color}>
                    {typeConfig[selectedTicket.type]?.label}
                  </Badge>
                  <Badge className={priorityConfig[selectedTicket.priority || 'medium']?.color}>
                    {priorityConfig[selectedTicket.priority || 'medium']?.label}
                  </Badge>
                </div>

                {(selectedTicket.customer_name || selectedTicket.customer_email || selectedTicket.customer_phone) && (
                  <div className="flex gap-4 text-sm">
                    {selectedTicket.customer_name && (
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {selectedTicket.customer_name}
                      </span>
                    )}
                    {selectedTicket.customer_email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {selectedTicket.customer_email}
                      </span>
                    )}
                    {selectedTicket.customer_phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {selectedTicket.customer_phone}
                      </span>
                    )}
                  </div>
                )}

                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium mb-2">Descripción</p>
                  <p className="whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>

                {selectedTicket.ai_response_draft && (
                  <div className="p-4 border border-primary/20 rounded-lg bg-primary/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="font-medium">Respuesta Sugerida por IA</span>
                    </div>
                    <p className="text-sm">{selectedTicket.ai_response_draft}</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => setNewMessage(selectedTicket.ai_response_draft || '')}
                    >
                      Usar sugerencia
                    </Button>
                  </div>
                )}

                <div className="border-t pt-4">
                  <p className="font-medium mb-3">Conversación</p>
                  <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
                    {ticketMessages.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Sin mensajes aún
                      </p>
                    ) : (
                      ticketMessages.map(msg => (
                        <div 
                          key={msg.id} 
                          className={`p-3 rounded-lg ${
                            msg.sender_type === 'staff' 
                              ? 'bg-primary/10 ml-8' 
                              : 'bg-muted mr-8'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">
                              {msg.sender_type === 'staff' ? 'Tú' : 'Cliente'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(msg.created_at), 'p', { locale: es })}
                            </span>
                          </div>
                          <p className="text-sm">{msg.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Escribe una respuesta..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-16">
                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Selecciona un ticket</h3>
                <p className="text-muted-foreground">
                  Haz clic en un ticket para ver los detalles
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Support;
