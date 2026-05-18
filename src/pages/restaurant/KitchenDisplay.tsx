import { useEffect, useState } from 'react';
import { Clock, UtensilsCrossed, CheckCircle2 } from 'lucide-react';
import { differenceInMinutes, differenceInSeconds } from 'date-fns';
import { useKitchenOrders } from '@/hooks/useKitchenOrders';
import { KitchenHeader } from '@/components/kitchen/KitchenHeader';
import { KitchenStatsBar } from '@/components/kitchen/KitchenStatsBar';
import { KitchenColumn } from '@/components/kitchen/KitchenColumn';

const KitchenDisplay = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { orders, loading, fetchOrders, updateOrderStatus } = useKitchenOrders(soundEnabled);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const getElapsedTime = (createdAt: string, startedAt?: string) => {
    const start = startedAt ? new Date(startedAt) : new Date(createdAt);
    const minutes = differenceInMinutes(currentTime, start);
    const seconds = differenceInSeconds(currentTime, start) % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isOrderUrgent = (createdAt: string) =>
    differenceInMinutes(currentTime, new Date(createdAt)) >= 15;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const pendingOrders = orders.filter((o) => o.kitchen_status === 'pending');
  const preparingOrders = orders.filter((o) => o.kitchen_status === 'preparing');
  const readyOrders = orders.filter((o) => o.kitchen_status === 'ready');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <KitchenHeader
        currentTime={currentTime}
        totalActive={orders.length}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onRefresh={fetchOrders}
        onToggleFullscreen={toggleFullscreen}
      />

      <KitchenStatsBar
        pending={pendingOrders.length}
        preparing={preparingOrders.length}
        ready={readyOrders.length}
      />

      <div className="grid grid-cols-3 gap-4 h-[calc(100vh-280px)]">
        <KitchenColumn
          title="Pendientes"
          dotColor="bg-yellow-500"
          orders={pendingOrders}
          emptyIcon={Clock}
          emptyText="Sin pedidos pendientes"
          onStatusChange={updateOrderStatus}
          isOrderUrgent={isOrderUrgent}
          getElapsedTime={getElapsedTime}
        />
        <KitchenColumn
          title="Preparando"
          dotColor="bg-blue-500"
          orders={preparingOrders}
          emptyIcon={UtensilsCrossed}
          emptyText="Nada en preparación"
          onStatusChange={updateOrderStatus}
          isOrderUrgent={isOrderUrgent}
          getElapsedTime={getElapsedTime}
        />
        <KitchenColumn
          title="Listos para Servir"
          dotColor="bg-green-500"
          orders={readyOrders}
          emptyIcon={CheckCircle2}
          emptyText="Sin pedidos listos"
          onStatusChange={updateOrderStatus}
          isOrderUrgent={isOrderUrgent}
          getElapsedTime={getElapsedTime}
          isReady
        />
      </div>
    </div>
  );
};

export default KitchenDisplay;
