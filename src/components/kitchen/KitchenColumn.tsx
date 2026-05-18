import { ScrollArea } from '@/components/ui/scroll-area';
import { LucideIcon } from 'lucide-react';
import { KitchenOrder } from './kitchenTypes';
import { KitchenOrderCard } from './KitchenOrderCard';

interface Props {
  title: string;
  dotColor: string;
  orders: KitchenOrder[];
  emptyIcon: LucideIcon;
  emptyText: string;
  onStatusChange: (orderId: string, status: KitchenOrder['kitchen_status']) => void;
  isOrderUrgent: (createdAt: string) => boolean;
  getElapsedTime: (createdAt: string, startedAt?: string) => string;
  isReady?: boolean;
}

export const KitchenColumn = ({
  title,
  dotColor,
  orders,
  emptyIcon: EmptyIcon,
  emptyText,
  onStatusChange,
  isOrderUrgent,
  getElapsedTime,
  isReady,
}: Props) => (
  <div className="flex flex-col">
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-3 h-3 rounded-full ${dotColor}`} />
      <h2 className="font-semibold text-lg">{title}</h2>
    </div>
    <ScrollArea className="flex-1 pr-2">
      <div className="space-y-3">
        {orders.map((order) => (
          <KitchenOrderCard
            key={order.id}
            order={order}
            onStatusChange={onStatusChange}
            isUrgent={isReady ? false : isOrderUrgent(order.created_at)}
            getElapsedTime={getElapsedTime}
            isReady={isReady}
          />
        ))}
        {orders.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <EmptyIcon className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>{emptyText}</p>
          </div>
        )}
      </div>
    </ScrollArea>
  </div>
);
