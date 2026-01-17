import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  PlayCircle, 
  Timer,
  UtensilsCrossed,
  AlertCircle,
  Volume2,
  VolumeX,
  Maximize2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInMinutes, differenceInSeconds } from 'date-fns';
import { es } from 'date-fns/locale';

interface KitchenOrder {
  id: string;
  order_number: number;
  items: Array<{
    name: string;
    quantity: number;
    notes?: string;
    modifiers?: string[];
  }>;
  kitchen_status: 'pending' | 'preparing' | 'ready' | 'served';
  kitchen_notes?: string;
  kitchen_started_at?: string;
  kitchen_ready_at?: string;
  created_at: string;
  order_type: string;
  table_id?: string;
}

const KitchenDisplay: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second for timers
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch initial orders
  const fetchOrders = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('restaurant_orders')
        .select('*')
        .eq('user_id', user.id)
        .in('kitchen_status', ['pending', 'preparing', 'ready'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const formattedOrders: KitchenOrder[] = (data || []).map(order => ({
        id: order.id,
        order_number: order.order_number,
        items: Array.isArray(order.items) ? order.items as KitchenOrder['items'] : [],
        kitchen_status: (order.kitchen_status as KitchenOrder['kitchen_status']) || 'pending',
        kitchen_notes: order.kitchen_notes || undefined,
        kitchen_started_at: order.kitchen_started_at || undefined,
        kitchen_ready_at: order.kitchen_ready_at || undefined,
        created_at: order.created_at,
        order_type: order.order_type,
        table_id: order.table_id || undefined
      }));
      
      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    fetchOrders();

    const channel = supabase
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'restaurant_orders',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Kitchen realtime update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as any;
            if (newOrder.kitchen_status !== 'served') {
              const formattedOrder: KitchenOrder = {
                id: newOrder.id,
                order_number: newOrder.order_number,
                items: Array.isArray(newOrder.items) ? newOrder.items : [],
                kitchen_status: newOrder.kitchen_status || 'pending',
                kitchen_notes: newOrder.kitchen_notes,
                kitchen_started_at: newOrder.kitchen_started_at,
                kitchen_ready_at: newOrder.kitchen_ready_at,
                created_at: newOrder.created_at,
                order_type: newOrder.order_type,
                table_id: newOrder.table_id
              };
              setOrders(prev => [...prev, formattedOrder]);
              
              // Play sound for new order
              if (soundEnabled) {
                playNotificationSound();
              }
              toast.info(`🆕 Nuevo pedido #${newOrder.order_number}`);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedOrder = payload.new as any;
            if (updatedOrder.kitchen_status === 'served') {
              setOrders(prev => prev.filter(o => o.id !== updatedOrder.id));
            } else {
              setOrders(prev => prev.map(o => 
                o.id === updatedOrder.id 
                  ? {
                      ...o,
                      kitchen_status: updatedOrder.kitchen_status,
                      kitchen_notes: updatedOrder.kitchen_notes,
                      kitchen_started_at: updatedOrder.kitchen_started_at,
                      kitchen_ready_at: updatedOrder.kitchen_ready_at
                    }
                  : o
              ));
            }
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(o => o.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, soundEnabled]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => {
        // Fallback: use Web Audio API
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      });
    } catch (e) {
      console.log('Could not play sound');
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: KitchenOrder['kitchen_status']) => {
    try {
      const updates: Record<string, any> = { kitchen_status: newStatus };
      
      if (newStatus === 'preparing') {
        updates.kitchen_started_at = new Date().toISOString();
      } else if (newStatus === 'ready') {
        updates.kitchen_ready_at = new Date().toISOString();
        if (soundEnabled) playNotificationSound();
      }

      const { error } = await supabase
        .from('restaurant_orders')
        .update(updates)
        .eq('id', orderId);

      if (error) throw error;
      
      toast.success(`Pedido actualizado a: ${getStatusLabel(newStatus)}`);
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Error al actualizar pedido');
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'preparing': return 'Preparando';
      case 'ready': return 'Listo';
      case 'served': return 'Servido';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'preparing': return 'bg-blue-500';
      case 'ready': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getElapsedTime = (createdAt: string, startedAt?: string) => {
    const start = startedAt ? new Date(startedAt) : new Date(createdAt);
    const minutes = differenceInMinutes(currentTime, start);
    const seconds = differenceInSeconds(currentTime, start) % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isOrderUrgent = (createdAt: string) => {
    const minutes = differenceInMinutes(currentTime, new Date(createdAt));
    return minutes >= 15;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const pendingOrders = orders.filter(o => o.kitchen_status === 'pending');
  const preparingOrders = orders.filter(o => o.kitchen_status === 'preparing');
  const readyOrders = orders.filter(o => o.kitchen_status === 'ready');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ChefHat className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Kitchen Display System</h1>
            <p className="text-muted-foreground">
              {format(currentTime, "EEEE, d 'de' MMMM - HH:mm:ss", { locale: es })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-4 py-2">
            {orders.length} pedidos activos
          </Badge>
          
          <Button
            variant="outline"
            size="icon"
            onClick={fetchOrders}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="bg-yellow-500/10 border-yellow-500/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">Pendientes</p>
              <p className="text-3xl font-bold text-yellow-600">{pendingOrders.length}</p>
            </div>
            <Clock className="h-10 w-10 text-yellow-500" />
          </CardContent>
        </Card>
        
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Preparando</p>
              <p className="text-3xl font-bold text-blue-600">{preparingOrders.length}</p>
            </div>
            <PlayCircle className="h-10 w-10 text-blue-500" />
          </CardContent>
        </Card>
        
        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Listos</p>
              <p className="text-3xl font-bold text-green-600">{readyOrders.length}</p>
            </div>
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </CardContent>
        </Card>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-3 gap-4 h-[calc(100vh-280px)]">
        {/* Pending Column */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <h2 className="font-semibold text-lg">Pendientes</h2>
          </div>
          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-3">
              {pendingOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  currentTime={currentTime}
                  onStatusChange={updateOrderStatus}
                  isUrgent={isOrderUrgent(order.created_at)}
                  getElapsedTime={getElapsedTime}
                />
              ))}
              {pendingOrders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>Sin pedidos pendientes</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Preparing Column */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <h2 className="font-semibold text-lg">Preparando</h2>
          </div>
          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-3">
              {preparingOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  currentTime={currentTime}
                  onStatusChange={updateOrderStatus}
                  isUrgent={isOrderUrgent(order.created_at)}
                  getElapsedTime={getElapsedTime}
                />
              ))}
              {preparingOrders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <UtensilsCrossed className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>Nada en preparación</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Ready Column */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <h2 className="font-semibold text-lg">Listos para Servir</h2>
          </div>
          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-3">
              {readyOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  currentTime={currentTime}
                  onStatusChange={updateOrderStatus}
                  isUrgent={false}
                  getElapsedTime={getElapsedTime}
                  isReady
                />
              ))}
              {readyOrders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>Sin pedidos listos</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

interface OrderCardProps {
  order: KitchenOrder;
  currentTime: Date;
  onStatusChange: (orderId: string, status: KitchenOrder['kitchen_status']) => void;
  isUrgent: boolean;
  getElapsedTime: (createdAt: string, startedAt?: string) => string;
  isReady?: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onStatusChange,
  isUrgent,
  getElapsedTime,
  isReady
}) => {
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
    <Card className={`${isUrgent && !isReady ? 'border-red-500 animate-pulse' : ''} ${isReady ? 'border-green-500 bg-green-500/5' : ''}`}>
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl font-bold">#{order.order_number}</CardTitle>
            {isUrgent && !isReady && (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
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
            {order.order_type === 'dine_in' ? 'Mesa' : 
             order.order_type === 'takeout' ? 'Para llevar' : 'Delivery'}
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
                  <p className="text-sm text-muted-foreground">
                    {item.modifiers.join(', ')}
                  </p>
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

export default KitchenDisplay;
