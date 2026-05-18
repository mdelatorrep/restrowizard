import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MapPin, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  orders: any[];
  onUpdate: (id: string, status: string) => void;
}

export const PendingDeliveryTable = ({ orders, onUpdate }: Props) => {
  if (orders.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No hay pedidos pendientes</div>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pedido</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Dirección</TableHead>
          <TableHead>Items</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Hora</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(orders || []).map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-medium">#{order.id.slice(-6)}</TableCell>
            <TableCell>{order.customer_name || 'Cliente'}</TableCell>
            <TableCell className="max-w-[200px] truncate">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {order.delivery_address || 'Sin dirección'}
              </div>
            </TableCell>
            <TableCell>{(order.items as any[])?.length || 0} items</TableCell>
            <TableCell className="text-right font-bold">${(order.total || 0).toLocaleString()}</TableCell>
            <TableCell>{format(new Date(order.created_at), 'HH:mm', { locale: es })}</TableCell>
            <TableCell className="text-right">
              <div className="flex gap-1 justify-end">
                <Button size="sm" onClick={() => onUpdate(order.id, 'preparing')}>Aceptar</Button>
                <Button size="sm" variant="destructive" onClick={() => onUpdate(order.id, 'cancelled')}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
