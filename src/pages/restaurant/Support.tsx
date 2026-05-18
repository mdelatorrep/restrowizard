import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupportTickets, SupportTicket } from '@/hooks/useSupportTickets';
import { Headphones, Plus, Loader2 } from 'lucide-react';
import { TicketCard } from '@/components/support/TicketCard';
import { SupportKPIs } from '@/components/support/SupportKPIs';
import { CreateTicketDialog } from '@/components/support/CreateTicketDialog';
import { TicketDetailPanel } from '@/components/support/TicketDetailPanel';

const Support = () => {
  const { tickets, kpis, loading, hasData, createTicket, updateTicket, addMessage } = useSupportTickets();
  const [ticketMessages, setTicketMessages] = useState<Array<{ id: string; sender_type: string; message: string; created_at: string }>>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const handleSelectTicket = (ticket: SupportTicket) => {
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

  const filteredTickets = (tickets || []).filter(t =>
    filterStatus === 'all' ? true : t.status === filterStatus
  );

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
        <CreateTicketDialog onCreate={createTicket} />
      </div>

      <SupportKPIs kpis={kpis} />

      <div className="grid lg:grid-cols-3 gap-6">
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
                <Button size="sm" disabled variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Usa el botón "Nuevo Ticket"
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

        <div className="lg:col-span-2">
          <TicketDetailPanel
            ticket={selectedTicket}
            messages={ticketMessages}
            newMessage={newMessage}
            onNewMessageChange={setNewMessage}
            onSendMessage={handleSendMessage}
            onUpdateStatus={handleUpdateStatus}
          />
        </div>
      </div>
    </div>
  );
};

export default Support;
