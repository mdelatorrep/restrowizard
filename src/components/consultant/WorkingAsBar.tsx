import React from 'react';
import { Building2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useActiveClient } from '@/contexts/ActiveClientContext';

export const WorkingAsBar: React.FC = () => {
  const { activeClient, clearActiveClient, isConsultantMode } = useActiveClient();

  if (!isConsultantMode || !activeClient) {
    return null;
  }

  return (
    <div className="bg-primary/10 border-b border-primary/20 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-lato-medium text-foreground">
            Trabajando como:
          </span>
          <Badge variant="secondary" className="font-lato-bold">
            {activeClient.business?.name || 'Cliente'}
          </Badge>
          {activeClient.business?.city && (
            <span className="text-sm text-muted-foreground font-lato-light">
              · {activeClient.business.city}
            </span>
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
