import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Eye, MessageSquare, MoreVertical, Mail, DollarSign, Calendar,
  Link2, Copy, UserCheck, Clock,
} from 'lucide-react';

const cuisineIcon = (cuisine?: string | null) => {
  switch (cuisine) {
    case 'italiana': return '🍝';
    case 'japonesa': return '🍣';
    case 'mexicana': return '🌮';
    case 'china': return '🥡';
    default: return '🍽️';
  }
};

const getHealthColor = (score: number) => {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  return 'text-destructive';
};

const renderStatusBadge = (client: any) => {
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
    churned: { variant: 'destructive', label: 'Perdido' },
  };
  const config = variants[client.status] || variants.prospect;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

interface Props {
  client: any;
  onWorkWith: (client: any) => void;
  onCopyInvite: (client: any) => void;
  onOpenInvite: (client: any) => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

export const ConsultantClientCard: React.FC<Props> = ({
  client, onWorkWith, onCopyInvite, onOpenInvite, onStatusChange, onDelete,
}) => {
  const cuisine = client.business?.cuisine_type || client.restaurant_cuisine_type;

  return (
    <Card className={client.status === 'paused' ? 'opacity-70' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-xl">
              {cuisineIcon(cuisine)}
            </div>
            <div>
              <CardTitle className="text-lg">
                {client.business?.name || client.restaurant_name || 'Sin nombre'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {client.business?.city || client.restaurant_city || 'Ciudad'}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onWorkWith(client)}>
                <Eye className="h-4 w-4 mr-2" />
                Trabajar con cliente
              </DropdownMenuItem>
              {!client.client_user_id && (
                <>
                  <DropdownMenuItem onClick={() => onCopyInvite(client)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar link de invitación
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onOpenInvite(client)}>
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar invitación
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onStatusChange(client.id, 'active')}>
                Marcar como Activo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange(client.id, 'paused')}>
                Pausar Cliente
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(client.id)}
              >
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          {renderStatusBadge(client)}
          {(client.alerts_count || 0) > 0 && (
            <Badge variant="destructive">{client.alerts_count} alertas</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {!client.client_user_id && client.restaurant_email && (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {client.restaurant_email}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>${(client.monthly_fee || 0).toLocaleString()}/mes</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{client.start_date
              ? new Date(client.start_date).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })
              : 'Sin fecha'}
            </span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" size="sm" onClick={() => onWorkWith(client)}>
            <Eye className="h-4 w-4 mr-1" />
            Dashboard
          </Button>
          {!client.client_user_id ? (
            <Button variant="outline" className="flex-1" size="sm" onClick={() => onCopyInvite(client)}>
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
  );
};
