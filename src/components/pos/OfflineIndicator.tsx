import { useState } from 'react';
import { WifiOff, Cloud, CloudOff, RefreshCw, Trash2, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { PendingSale } from '@/lib/offlineStorage';

interface OfflineIndicatorProps {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: Date | null;
  syncErrors: string[];
  onSync: () => void;
  onRetryFailed: () => void;
  onClearPending: () => void;
  getPendingSales: () => Promise<PendingSale[]>;
}

export const OfflineIndicator = ({
  isOnline,
  isSyncing,
  pendingCount,
  lastSyncAt,
  syncErrors,
  onSync,
  onRetryFailed,
  onClearPending,
  getPendingSales
}: OfflineIndicatorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingSales, setPendingSales] = useState<PendingSale[]>([]);

  const handleExpand = async (open: boolean) => {
    setIsExpanded(open);
    if (open) {
      const sales = await getPendingSales();
      setPendingSales(sales);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (isOnline && pendingCount === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Cloud className="h-4 w-4 text-green-500" />
        <span>Conectado</span>
      </div>
    );
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={handleExpand}>
      <div className={cn(
        "rounded-lg border p-3 transition-colors",
        isOnline 
          ? "bg-amber-500/10 border-amber-500/30" 
          : "bg-destructive/10 border-destructive/30"
      )}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              {isOnline ? (
                <Cloud className="h-5 w-5 text-amber-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-destructive" />
              )}
              
              <div>
                <p className="font-medium text-sm">
                  {isOnline ? 'Sincronizando...' : 'Modo Offline'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {pendingCount} venta(s) pendiente(s)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {pendingCount > 0 && (
                <Badge variant="secondary" className="bg-amber-500/20 text-amber-700">
                  {pendingCount}
                </Badge>
              )}
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-3 space-y-3">
          {/* Sync Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onSync}
              disabled={!isOnline || isSyncing}
              className="flex-1"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isSyncing && "animate-spin")} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
            </Button>

            {syncErrors.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetryFailed}
                disabled={!isOnline || isSyncing}
              >
                Reintentar fallidos
              </Button>
            )}
          </div>

          {/* Last Sync Info */}
          {lastSyncAt && (
            <p className="text-xs text-muted-foreground">
              Última sincronización: {formatDate(lastSyncAt)}
            </p>
          )}

          {/* Sync Errors */}
          {syncErrors.length > 0 && (
            <div className="bg-destructive/10 rounded-md p-2">
              <p className="text-xs font-medium text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Errores de sincronización:
              </p>
              <ul className="text-xs text-destructive/80 mt-1 space-y-1">
                {syncErrors.map((error, i) => (
                  <li key={i}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Pending Sales List */}
          {pendingSales.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium">Ventas pendientes:</p>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {pendingSales.map((sale) => (
                  <div 
                    key={sale.id}
                    className="bg-background/50 rounded-md p-2 text-xs border"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {formatCurrency(sale.total)}
                      </span>
                      <Badge 
                        variant={sale.syncStatus === 'failed' ? 'destructive' : 'secondary'}
                        className="text-[10px]"
                      >
                        {sale.syncStatus === 'pending' && 'Pendiente'}
                        {sale.syncStatus === 'syncing' && 'Sincronizando'}
                        {sale.syncStatus === 'failed' && 'Fallido'}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1">
                      {sale.items.length} item(s) • {formatDate(sale.createdAt)}
                    </p>
                    {sale.lastError && (
                      <p className="text-destructive mt-1 text-[10px]">
                        Error: {sale.lastError}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clear Data */}
          {pendingCount > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar ventas pendientes
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar ventas pendientes?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará {pendingCount} venta(s) que no se han sincronizado.
                    Esta acción no se puede deshacer y se perderán los datos de estas ventas.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onClearPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
