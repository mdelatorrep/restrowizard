import React from 'react';
import { Building2, X, UserCheck, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useActiveClient } from '@/contexts/ActiveClientContext';

export const WorkingAsBar: React.FC = () => {
  const { activeClient, clearActiveClient, isConsultantMode, getClientDisplayName, getClientCity } = useActiveClient();

  if (!isConsultantMode || !activeClient) {
    return null;
  }

  const isLinked = !!activeClient.client_user_id;

  return (
    <div className="bg-primary/10 border-b border-primary/20 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-lato-medium text-foreground">
            Trabajando como:
          </span>
          <Badge variant="secondary" className="font-lato-bold">
            {getClientDisplayName(activeClient)}
          </Badge>
          {getClientCity(activeClient) && (
            <span className="text-sm text-muted-foreground font-lato-light">
              · {getClientCity(activeClient)}
            </span>
          )}
          {isLinked ? (
            <Badge variant="outline" className="text-xs gap-1">
              <UserCheck className="h-3 w-3" />
              Vinculado
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs gap-1 border-amber-500/50 text-amber-600">
              <Clock className="h-3 w-3" />
              Sin vincular
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearActiveClient}
          className="h-7 text-xs hover:bg-primary/20"
        >
          <X className="h-3 w-3 mr-1" />
          Cambiar
        </Button>
      </div>
    </div>
  );
};
