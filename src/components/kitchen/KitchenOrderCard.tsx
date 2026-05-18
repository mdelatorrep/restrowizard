import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Timer } from 'lucide-react';
import { format } from 'date-fns';
import { KitchenOrder } from './kitchenTypes';

interface OrderCardProps {
  order: KitchenOrder;
  onStatusChange: (orderId: string, status: KitchenOrder['kitchen_status']) => void;
  isUrgent: boolean;
  getElapsedTime: (createdAt: string, startedAt?: string) => string;
  isReady?: boolean;
}

export const KitchenOrderCard = ({
  order,
  onStatusChange,
  isUrgent,
  getElapsedTime,
  isReady,
}: OrderCardProps) => {
  const getNextAction = () => {
    switch (order.kitchen_status) {
      case 'pending':
        return { label: 'Iniciar', action: 'preparing' as const, color: 'bg-blue-500 hover:bg-blue-600' };
      case 'preparing':
        return { label: 'Listo', action: 'ready' as const, color: 'bg-green-500 hover:bg-green-600' };
      case 'ready':
        return { label: 'Servido', action: 'served' as const, color: 'bg-gray-500 hover:bg-gray-600' };
      default:
        return null;
    }
  };

  const nextAction = getNextAction();

  return (
    <Card
      className={`${isUrgent && !isReady ? 'border-red-500 animate-pulse' : ''} ${
        isReady ? 'border-green-500 bg-green-500/5' : ''
      }`}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl font-bold">#{order.order_number}</CardTitle>
            {isUrgent && !isReady && <AlertCircle className="h-5 w-5 text-red-500" />}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Timer className="h-4 w-4" />
            <span className={`font-mono ${isUrgent && !isReady ? 'text-red-500 font-bold' : ''}`}>
              {getElapsedTime(order.created_at, order.kitchen_started_at)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            {order.order_type === 'dine_in'
              ? 'Mesa'
              : order.order_type === 'takeout'
              ? 'Para llevar'
              : 'Delivery'}
          </Badge>
          <span>{format(new Date(order.created_at), 'HH:mm')}</span>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="space-y-2 mb-3">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="font-bold text-lg min-w-[24px]">{item.quantity}x</span>
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                {item.notes && (
                  <p className="text-sm text-orange-500 italic">📝 {item.notes}</p>
                )}
                {item.modifiers && item.modifiers.length > 0 && (
                  <p className="text-sm text-muted-foreground">{item.modifiers.join(', ')}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {order.kitchen_notes && (
          <div className="mb-3 p-2 bg-orange-500/10 rounded text-sm text-orange-600">
            ⚠️ {order.kitchen_notes}
          </div>
        )}

        {nextAction && (
          <Button
            className={`w-full ${nextAction.color} text-white`}
            onClick={() => onStatusChange(order.id, nextAction.action)}
          >
            {nextAction.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
