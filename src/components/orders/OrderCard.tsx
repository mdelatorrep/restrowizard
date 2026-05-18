import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Phone, MapPin, DollarSign } from 'lucide-react';
import type { RestaurantOrder } from '@/hooks/useOrders';
import { OrderStatusBadge } from './OrderStatusBadge';
import { ORDER_STATUS_OPTIONS } from './orderStatusConfig';

interface Props {
  order: RestaurantOrder;
  onUpdateStatus: (id: string, status: string) => void;
}

export const OrderCard: React.FC<Props> = ({ order, onUpdateStatus }) => {
  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Pedido #{order.order_number}</CardTitle>
            <CardDescription>
              {format(new Date(order.created_at!), 'PPp', { locale: es })}
            </CardDescription>
          </div>
          <OrderStatusBadge status={order.status || 'pending'} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {order.customer_name && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{order.customer_name}</span>
            </div>
          )}
          {order.customer_phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{order.customer_phone}</span>
            </div>
          )}
          {order.delivery_address && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="line-clamp-1">{order.delivery_address}</span>
            </div>
          )}
        </div>

        <div className="border-t pt-3">
          <p className="text-sm font-medium mb-2">Items ({items.length})</p>
          <div className="space-y-1">
            {items.slice(0, 3).map((item: { name?: string; quantity?: number }, idx: number) => (
              <div key={idx} className="text-sm text-muted-foreground flex justify-between">
                <span>{item.quantity}x {item.name}</span>
              </div>
            ))}
            {items.length > 3 && (
              <p className="text-xs text-muted-foreground">+{items.length - 3} más</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            <span className="font-bold">${order.total.toLocaleString()}</span>
          </div>
          <Select
            value={order.status || 'pending'}
            onValueChange={(value) => onUpdateStatus(order.id, value)}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUS_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
