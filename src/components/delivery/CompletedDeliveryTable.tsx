import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getDeliveryStatusLabel } from './deliveryStatusConfig';

interface Props {
  orders: any[];
}

export const CompletedDeliveryTable = ({ orders }: Props) => {
  if (orders.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No hay pedidos completados hoy</div>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pedido</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Dirección</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Hora</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(orders || []).slice(0, 20).map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-medium">#{order.id.slice(-6)}</TableCell>
            <TableCell>{order.customer_name || 'Cliente'}</TableCell>
            <TableCell className="max-w-[200px] truncate">{order.delivery_address || '-'}</TableCell>
            <TableCell className="text-right font-bold">${(order.total || 0).toLocaleString()}</TableCell>
            <TableCell>
              <Badge variant="default" className="bg-green-600">
                {getDeliveryStatusLabel(order.status)}
              </Badge>
            </TableCell>
            <TableCell>{format(new Date(order.created_at), 'HH:mm', { locale: es })}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
