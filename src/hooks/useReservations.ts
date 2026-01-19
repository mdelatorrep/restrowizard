import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Reservation {
  id: string;
  user_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  special_requests: string | null;
  source: string;
  confirmation_code: string;
  reminder_sent: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReservationKPIs {
  total: number;
  pending: number;
  confirmed: number;
  todayCount: number;
  thisWeekCount: number;
}

export function useReservations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [kpis, setKpis] = useState<ReservationKPIs>({
    total: 0,
    pending: 0,
    confirmed: 0,
    todayCount: 0,
    thisWeekCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const calculateKPIs = (data: Reservation[]): ReservationKPIs => {
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];
    
    return {
      total: data.length,
      pending: data.filter(r => r.status === 'pending').length,
      confirmed: data.filter(r => r.status === 'confirmed').length,
      todayCount: data.filter(r => r.reservation_date === today).length,
      thisWeekCount: data.filter(r => r.reservation_date >= weekStartStr).length,
    };
  };

  const fetchReservations = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('table_reservations')
        .select('*')
        .eq('user_id', user.id)
        .order('reservation_date', { ascending: true })
        .order('reservation_time', { ascending: true });
      
      if (error) throw error;
      
      const typedData = (data || []) as Reservation[];
      setReservations(typedData);
      setKpis(calculateKPIs(typedData));
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchReservations();
    }
  }, [user?.id]);

  const updateReservationStatus = async (id: string, status: Reservation['status'], notes?: string) => {
    try {
      const updates: Partial<Reservation> = { status };
      if (notes) updates.notes = notes;
      
      const { error } = await supabase
        .from('table_reservations')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      
      setReservations(prev => 
        prev.map(r => r.id === id ? { ...r, ...updates } : r)
      );
      
      toast({
        title: "Reserva actualizada",
        description: `Estado cambiado a ${status}`,
      });
      
      return true;
    } catch (error) {
      console.error('Error updating reservation:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la reserva",
        variant: "destructive",
      });
      return false;
    }
  };

  const createReservation = async (reservationData: {
    customer_name: string;
    customer_email?: string;
    customer_phone: string;
    party_size: number;
    reservation_date: string;
    reservation_time: string;
    special_requests?: string;
    source?: string;
  }) => {
    if (!user?.id) return null;
    
    try {
      const { data, error } = await supabase
        .from('table_reservations')
        .insert({
          ...reservationData,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setReservations(prev => [...prev, data as Reservation]);
      
      toast({
        title: "Reserva creada",
        description: `Código: ${data.confirmation_code}`,
      });
      
      return data as Reservation;
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la reserva",
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    reservations,
    kpis,
    loading,
    updateReservationStatus,
    createReservation,
    refetch: fetchReservations,
  };
}

// Hook for public reservation creation
export function usePublicReservation() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createPublicReservation = async (
    restaurantUserId: string,
    reservationData: {
      customer_name: string;
      customer_email?: string;
      customer_phone: string;
      party_size: number;
      reservation_date: string;
      reservation_time: string;
      special_requests?: string;
    }
  ) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('table_reservations')
        .insert({
          ...reservationData,
          user_id: restaurantUserId,
          source: 'website',
        })
        .select('confirmation_code')
        .single();
      
      if (error) throw error;
      
      toast({
        title: "¡Reserva confirmada!",
        description: `Tu código de confirmación es: ${data.confirmation_code}`,
      });
      
      return data.confirmation_code;
    } catch (error) {
      console.error('Error creating public reservation:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la reserva. Intenta de nuevo.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createPublicReservation, loading };
}
