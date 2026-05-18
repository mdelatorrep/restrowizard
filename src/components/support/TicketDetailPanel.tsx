import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Mail, Phone, MessageSquare, Send, Sparkles } from 'lucide-react';
import type { SupportTicket } from '@/hooks/useSupportTickets';
import { ticketTypeConfig, ticketPriorityConfig, TICKET_STATUS_OPTIONS } from './supportConfig';

interface Props {
  ticket: SupportTicket | null;
  messages: Array<{ id: string; sender_type: string; message: string; created_at: string }>;
  newMessage: string;
  onNewMessageChange: (value: string) => void;
  onSendMessage: () => void;
  onUpdateStatus: (status: string) => void;
}

export const TicketDetailPanel: React.FC<Props> = ({
  ticket, messages, newMessage, onNewMessageChange, onSendMessage, onUpdateStatus,
}) => {
  if (!ticket) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center py-16">
          <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Selecciona un ticket</h3>
          <p className="text-muted-foreground">Haz clic en un ticket para ver los detalles</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>#{ticket.ticket_number} - {ticket.subject}</CardTitle>
            <CardDescription>
              {format(new Date(ticket.created_at!), 'PPpp', { locale: es })}
            </CardDescription>
          </div>
          <Select value={ticket.status || 'open'} onValueChange={onUpdateStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TICKET_STATUS_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <Badge className={ticketTypeConfig[ticket.type]?.color}>
            {ticketTypeConfig[ticket.type]?.label}
          </Badge>
          <Badge className={ticketPriorityConfig[ticket.priority || 'medium']?.color}>
            {ticketPriorityConfig[ticket.priority || 'medium']?.label}
          </Badge>
        </div>

        {(ticket.customer_name || ticket.customer_email || ticket.customer_phone) && (
          <div className="flex gap-4 text-sm flex-wrap">
            {ticket.customer_name && (
              <span className="flex items-center gap-1"><User className="h-4 w-4" />{ticket.customer_name}</span>
            )}
            {ticket.customer_email && (
              <span className="flex items-center gap-1"><Mail className="h-4 w-4" />{ticket.customer_email}</span>
            )}
            {ticket.customer_phone && (
              <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{ticket.customer_phone}</span>
            )}
          </div>
        )}

        <div className="p-4 bg-muted rounded-lg">
          <p className="font-medium mb-2">Descripción</p>
          <p className="whitespace-pre-wrap">{ticket.description}</p>
        </div>

        {ticket.ai_response_draft && (
          <div className="p-4 border border-primary/20 rounded-lg bg-primary/5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-medium">Respuesta Sugerida por IA</span>
            </div>
            <p className="text-sm">{ticket.ai_response_draft}</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => onNewMessageChange(ticket.ai_response_draft || '')}
            >
              Usar sugerencia
            </Button>
          </div>
        )}

        <div className="border-t pt-4">
          <p className="font-medium mb-3">Conversación</p>
          <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin mensajes aún</p>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg ${
                    msg.sender_type === 'staff' ? 'bg-primary/10 ml-8' : 'bg-muted mr-8'
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
              onChange={(e) => onNewMessageChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
            />
            <Button onClick={onSendMessage}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
