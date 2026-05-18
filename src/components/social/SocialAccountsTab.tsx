import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { platformConfig } from './socialConfig';

interface Account {
  id: string;
  platform: string;
  account_name: string;
  is_active?: boolean | null;
  last_sync_at?: string | null;
}

interface Props {
  accounts: Account[];
  onConnect: () => void;
}

export const SocialAccountsTab: React.FC<Props> = ({ accounts, onConnect }) => {
  if ((accounts || []).length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Globe className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Sin cuentas conectadas</h3>
          <p className="text-muted-foreground text-center mb-4">
            Conecta tus perfiles de redes para monitorear menciones automáticamente
          </p>
          <Button onClick={onConnect}>
            <Globe className="h-4 w-4 mr-2" />
            Conectar Primera Cuenta
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {accounts.map(account => (
        <Card key={account.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge className={platformConfig[account.platform]?.color}>
                {platformConfig[account.platform]?.label}
              </Badge>
              <Badge variant={account.is_active ? 'default' : 'secondary'}>
                {account.is_active ? 'Activa' : 'Inactiva'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{account.account_name}</p>
            {account.last_sync_at && (
              <p className="text-xs text-muted-foreground mt-1">
                Último sync: {format(new Date(account.last_sync_at), 'PPp', { locale: es })}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
