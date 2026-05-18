import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SupportTicket } from '@/hooks/useSupportTickets';
import { ticketTypeConfig, ticketPriorityConfig, ticketStatusConfig } from './supportConfig';

interface Props {
  ticket: SupportTicket;
  onClick: () => void;
}

export const TicketCard: React.FC<Props> = ({ ticket, onClick }) => {
  const status = ticketStatusConfig[ticket.status || 'open'];
  const StatusIcon = status.icon;
  const type = ticketTypeConfig[ticket.type] || ticketTypeConfig.peticion;
  const priority = ticketPriorityConfig[ticket.priority || 'medium'];

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
