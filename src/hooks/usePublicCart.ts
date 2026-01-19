import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  image_url?: string;
}

export interface DeliveryZone {
  id: string;
  zone_name: string;
  delivery_fee: number;
  min_order: number;
  estimated_time_minutes: number;
}

export interface OrderResult {
  success: boolean;
  order_number?: number;
  order_id?: string;
  total?: number;
  delivery_fee?: number;
  estimated_time_minutes?: number;
  error?: string;
}

export function usePublicCart(restaurantUserId: string) {
  const { toast } = useToast();
  const [items, setItems] = useState<CartItem[]>([]);
  const [deliveryZone, setDeliveryZone] = useState<DeliveryZone | null>(null);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadZones = useCallback(async () => {
    if (!restaurantUserId) return;
    
    const { data } = await supabase
      .from('delivery_zones')
      .select('id, zone_name, delivery_fee, min_order, estimated_time_minutes')
      .eq('user_id', restaurantUserId)
      .eq('is_active', true)
      .order('zone_name');
    
    if (data) {
      setZones(data);
    }
  }, [restaurantUserId]);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => 
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    
    toast({
      title: "Añadido al carrito",
      description: item.name,
    });
  }, [toast]);

  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    
    setItems(prev => prev.map(i => 
      i.id === itemId ? { ...i, quantity: Math.min(99, quantity) } : i
    ));
  }, [removeItem]);

  const updateNotes = useCallback((itemId: string, notes: string) => {
    setItems(prev => prev.map(i => 
      i.id === itemId ? { ...i, notes: notes.slice(0, 200) } : i
    ));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setDeliveryZone(null);
  }, []);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = deliveryZone?.delivery_fee || 0;
  const total = subtotal + deliveryFee;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  const minOrderMet = !deliveryZone?.min_order || subtotal >= deliveryZone.min_order;

  const submitOrder = useCallback(async (customerData: {
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    delivery_address: string;
    delivery_notes?: string;
    payment_method: string;
  }): Promise<OrderResult> => {
    if (items.length === 0) {
      return { success: false, error: 'El carrito está vacío' };
    }

    if (!minOrderMet && deliveryZone) {
      return { 
        success: false, 
        error: `El pedido mínimo para esta zona es $${deliveryZone.min_order.toLocaleString()}` 
      };
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('website-public-order', {
        body: {
          restaurant_user_id: restaurantUserId,
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes,
          })),
          customer_name: customerData.customer_name.trim(),
          customer_phone: customerData.customer_phone.trim(),
          customer_email: customerData.customer_email?.trim(),
          delivery_address: customerData.delivery_address.trim(),
          delivery_notes: customerData.delivery_notes?.trim(),
          delivery_zone_id: deliveryZone?.id,
          payment_method: customerData.payment_method,
        },
      });

      if (error) {
        console.error('Order error:', error);
        return { success: false, error: 'Error al procesar el pedido. Intenta de nuevo.' };
      }

      if (data.error) {
        return { success: false, error: data.error };
      }

      // Clear cart on success
      clearCart();

      return {
        success: true,
        order_number: data.order_number,
        order_id: data.order_id,
        total: data.total,
        delivery_fee: data.delivery_fee,
        estimated_time_minutes: data.estimated_time_minutes,
      };
    } catch (err) {
      console.error('Submit order error:', err);
      return { success: false, error: 'Error de conexión. Verifica tu internet.' };
    } finally {
      setSubmitting(false);
    }
  }, [items, restaurantUserId, deliveryZone, minOrderMet, clearCart]);

  return {
    items,
    zones,
    deliveryZone,
    subtotal,
    deliveryFee,
    total,
    itemCount,
    minOrderMet,
    submitting,
    loadZones,
    addItem,
    removeItem,
    updateQuantity,
    updateNotes,
    clearCart,
    setDeliveryZone,
    submitOrder,
  };
}
