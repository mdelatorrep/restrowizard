import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MapPin, CheckCircle } from 'lucide-react';

interface Props {
  orders: any[];
  onUpdate: (id: string, status: string) => void;
}

export const EnRouteDeliveryTable = ({ orders, onUpdate }: Props) => {
  if (orders.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No hay pedidos en camino</div>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pedido</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Dirección</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(orders || []).map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-medium">#{order.id.slice(-6)}</TableCell>
            <TableCell>{order.customer_name || 'Cliente'}</TableCell>
            <TableCell className="max-w-[250px]">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{order.delivery_address || 'Sin dirección'}</span>
              </div>
            </TableCell>
            <TableCell className="text-right font-bold">${(order.total || 0).toLocaleString()}</TableCell>
            <TableCell className="text-right">
              <Button size="sm" onClick={() => onUpdate(order.id, 'delivered')}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Entregado
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
