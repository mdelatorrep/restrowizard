import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Calculator, CheckCircle2, DollarSign, WifiOff } from 'lucide-react';

interface Props {
  hasOpenSession: boolean;
  currentSession: any;
  isOnline: boolean;
  pendingCount: number;
  onOpenSession: () => void;
  onCloseSession: () => void;
}

export const POSHeader = ({
  hasOpenSession,
  currentSession,
  isOnline,
  pendingCount,
  onOpenSession,
  onCloseSession,
}: Props) => {
  return (
    <div className="bg-card border-b px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {hasOpenSession ? (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Caja Abierta
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertCircle className="h-3 w-3 mr-1" />
              Caja Cerrada
            </Badge>
          )}
        </div>
        {currentSession && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <div className="text-sm">
              <span className="text-muted-foreground">Cajero:</span>{' '}
              <span className="font-medium">{currentSession.cashier_name}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Ventas:</span>{' '}
              <span className="font-medium">{currentSession.sales_count}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Total:</span>{' '}
              <span className="font-medium text-primary">
                ${Number(currentSession.total_sales).toLocaleString()}
              </span>
            </div>
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        {(!isOnline || pendingCount > 0) && (
          <div className="flex items-center gap-2">
            {!isOnline && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <WifiOff className="h-3 w-3" />
                Offline
              </Badge>
            )}
            {pendingCount > 0 && (
              <Badge variant="secondary" className="bg-amber-500/20 text-amber-700">
                {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        )}

        {!hasOpenSession ? (
          <Button size="sm" onClick={onOpenSession}>
            <DollarSign className="h-4 w-4 mr-1" />
            Abrir Caja
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={onCloseSession}>
            <Calculator className="h-4 w-4 mr-1" />
            Cerrar Caja
          </Button>
        )}
      </div>
    </div>
  );
};
