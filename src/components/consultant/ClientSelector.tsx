import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown, Building2, Plus, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useActiveClient } from '@/contexts/ActiveClientContext';

interface ClientSelectorProps {
  compact?: boolean;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({ compact = false }) => {
  const navigate = useNavigate();
  const { activeClient, setActiveClient, clients, loading } = useActiveClient();

  const activeClients = clients.filter(c => c.status === 'active');

  if (loading) {
    return (
      <div className="h-10 w-full bg-sidebar-accent/30 animate-pulse rounded-lg" />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={cn(
            "w-full justify-between bg-sidebar-accent/50 border-sidebar-border hover:bg-sidebar-accent",
            compact ? "h-9" : "h-12"
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 shrink-0 text-sidebar-foreground/70" />
            {activeClient ? (
              <div className="flex flex-col items-start truncate">
                <span className="font-lato-medium text-sm truncate text-sidebar-foreground">
                  {activeClient.business?.name || 'Sin nombre'}
                </span>
                {!compact && activeClient.business?.city && (
                  <span className="text-xs text-sidebar-foreground/60 truncate">
                    {activeClient.business.city}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-sidebar-foreground/70 font-lato-light text-sm">
                Seleccionar cliente...
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {activeClient?.alerts_count && activeClient.alerts_count > 0 && (
              <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                {activeClient.alerts_count > 9 ? '9+' : activeClient.alerts_count}
              </Badge>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 text-sidebar-foreground/70" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel className="font-lato-medium">
          Seleccionar Cliente
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {activeClients.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-lato-light">No tienes clientes activos</p>
            <Button 
              variant="link" 
              size="sm" 
              onClick={() => navigate('/c/dashboard')}
              className="mt-1"
            >
              Invitar cliente
            </Button>
          </div>
        ) : (
          <>
            {activeClients.map((client) => (
              <DropdownMenuItem
                key={client.id}
                onClick={() => setActiveClient(client)}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      client.diagnosis?.overall_score && client.diagnosis.overall_score >= 70 
                        ? "bg-green-500" 
                        : client.diagnosis?.overall_score && client.diagnosis.overall_score >= 40 
                          ? "bg-yellow-500" 
                          : "bg-red-500"
                    )} />
                    <div className="flex flex-col">
                      <span className="font-lato-medium text-sm">
                        {client.business?.name || 'Sin nombre'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {client.business?.city || 'Sin ubicación'}
                        {client.business?.cuisine_type && ` · ${client.business.cuisine_type}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {client.alerts_count && client.alerts_count > 0 && (
                      <Badge variant="outline" className="text-xs h-5">
                        {client.alerts_count}
                      </Badge>
                    )}
                    {activeClient?.id === client.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => navigate('/c/dashboard')}
          className="cursor-pointer text-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="font-lato-medium">Agregar nuevo cliente</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
