import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Truck } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  orders: any[];
  onUpdate: (id: string, status: string) => void;
}

export const PreparingDeliveryTable = ({ orders, onUpdate }: Props) => {
  if (orders.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No hay pedidos en preparación</div>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pedido</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Items</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Inicio</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(orders || []).map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-medium">#{order.id.slice(-6)}</TableCell>
            <TableCell>{order.customer_name || 'Cliente'}</TableCell>
            <TableCell>{(order.items as any[])?.length || 0} items</TableCell>
            <TableCell className="text-right font-bold">${(order.total || 0).toLocaleString()}</TableCell>
            <TableCell>{format(new Date(order.created_at), 'HH:mm', { locale: es })}</TableCell>
            <TableCell className="text-right">
              <Button size="sm" onClick={() => onUpdate(order.id, 'ready')}>
                <Truck className="h-4 w-4 mr-1" />
                Enviar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
