import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Receipt,
  Users,
  Table2,
  X,
} from 'lucide-react';
import { OfflineIndicator } from '@/components/pos/OfflineIndicator';
import type { POSCartItem } from '@/hooks/usePOSCart';

interface CartPanelProps {
  items: POSCartItem[];
  subtotal: number;
  taxAmount: number;
  taxLabel?: string;
  total: number;
  hasOpenSession: boolean;
  tables: any[];
  selectedTable: string | null;
  onSelectTable: (id: string | null) => void;
  customers: any[];
  customerSearch: string;
  onCustomerSearchChange: (q: string) => void;
  selectedCustomer: any;
  onSelectCustomer: (c: any) => void;
  onUpdateQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onCheckout: () => void;
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: any;
  syncErrors: any;
  onSync: () => void;
  onRetryFailed: () => void;
  onClearPending: () => void;
  getPendingSales: () => any;
}

export const CartPanel = ({
  items,
  subtotal,
  taxAmount,
  taxLabel = 'Impuesto',
  total,
  hasOpenSession,
  tables,
  selectedTable,
  onSelectTable,
  customers,
  customerSearch,
  onCustomerSearchChange,
  selectedCustomer,
  onSelectCustomer,
  onUpdateQty,
  onRemove,
  onClear,
  onCheckout,
  isOnline,
  isSyncing,
  pendingCount,
  lastSyncAt,
  syncErrors,
  onSync,
  onRetryFailed,
  onClearPending,
  getPendingSales,
}: CartPanelProps) => {
  const filteredCustomers = customers
    .filter(
      (c) =>
        c.customer_name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c as any).email?.toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c as any).phone?.includes(customerSearch)
    )
    .slice(0, 5);

  return (
    <div className="w-96 flex flex-col bg-card">
      <div className="p-4 border-b space-y-3">
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 justify-start" onClick={() => {}}>
            <Table2 className="h-4 w-4 mr-2" />
            {selectedTable
              ? `Mesa ${tables.find((t) => t.id === selectedTable)?.table_number}`
              : 'Sin mesa'}
          </Button>
          {selectedTable && (
            <Button variant="ghost" size="icon" onClick={() => onSelectTable(null)}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="relative">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={customerSearch}
            onChange={(e) => onCustomerSearchChange(e.target.value)}
            className="pl-10"
          />
          {customerSearch && filteredCustomers.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-10 bg-popover border rounded-lg shadow-lg mt-1">
              {filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  className="w-full px-4 py-2 text-left hover:bg-accent flex items-center justify-between"
                  onClick={() => {
                    onSelectCustomer(c);
                    onCustomerSearchChange('');
                  }}
                >
                  <div>
                    <p className="font-medium">{c.customer_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(c as any).phone || (c as any).email}
                    </p>
                  </div>
                  <Badge variant="secondary">{(c as any).lifetime_points || 0} pts</Badge>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedCustomer && (
          <div className="flex items-center justify-between bg-accent/50 rounded-lg px-3 py-2">
            <div>
              <p className="font-medium text-sm">{selectedCustomer.customer_name}</p>
              <p className="text-xs text-muted-foreground">
                {selectedCustomer.total_points} puntos
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onSelectCustomer(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 p-4">
        {items.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Carrito vacío</p>
            <p className="text-sm">Agrega productos para comenzar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 bg-accent/30 rounded-lg p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    ${item.price.toLocaleString()} c/u
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => onRemove(item.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <p className="font-bold w-20 text-right">
                  ${(item.price * item.quantity).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${subtotal.toLocaleString()}</span>
          </div>
          {taxAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{taxLabel}</span>
              <span>${taxAmount.toLocaleString()}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">${total.toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={onClear} disabled={items.length === 0}>
            <Trash2 className="h-4 w-4 mr-2" />
            Limpiar
          </Button>
          <Button
            onClick={onCheckout}
            disabled={items.length === 0 || !hasOpenSession}
            className="bg-primary"
          >
            <Receipt className="h-4 w-4 mr-2" />
            Cobrar
          </Button>
        </div>

        {(!isOnline || pendingCount > 0) && (
          <div className="mt-3">
            <OfflineIndicator
              isOnline={isOnline}
              isSyncing={isSyncing}
              pendingCount={pendingCount}
              lastSyncAt={lastSyncAt}
              syncErrors={syncErrors}
              onSync={onSync}
              onRetryFailed={onRetryFailed}
              onClearPending={onClearPending}
              getPendingSales={getPendingSales}
            />
          </div>
        )}
      </div>
    </div>
  );
};
