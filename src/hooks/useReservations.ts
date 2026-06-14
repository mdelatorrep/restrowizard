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
  table_id: string | null;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
}

/**
 * TK-J: detecta solapamiento de horario para una mesa.
 * Considera reservas no canceladas el mismo día cuya ventana [start, start+duration)
 * intersecta la nueva ventana solicitada.
 */
export const findOverlappingReservation = (
  reservations: Pick<Reservation, 'id' | 'table_id' | 'reservation_date' | 'reservation_time' | 'duration_minutes' | 'status'>[],
  tableId: string,
  date: string,
  time: string,
  durationMinutes: number,
  excludeId?: string,
) => {
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
  };
  const startA = toMin(time);
  const endA = startA + durationMinutes;
  return reservations.find(r =>
    r.id !== excludeId &&
    r.table_id === tableId &&
    r.reservation_date === date &&
    r.status !== 'cancelled' &&
    r.status !== 'no_show' &&
    (() => {
      const startB = toMin(r.reservation_time);
      const endB = startB + (r.duration_minutes || 90);
      return startA < endB && startB < endA;
    })()
  );
};


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
    table_id?: string | null;
    duration_minutes?: number;
  }) => {
    if (!user?.id) return null;

    const duration = reservationData.duration_minutes || 90;

    // TK-J: validar solapamiento si hay mesa asignada
    if (reservationData.table_id) {
      const conflict = findOverlappingReservation(
        reservations,
        reservationData.table_id,
        reservationData.reservation_date,
        reservationData.reservation_time,
        duration,
      );
      if (conflict) {
        toast({
          title: "Mesa ocupada",
          description: `Ya existe una reserva (${conflict.customer_name || conflict.id.slice(0, 6)}) en esa franja. Elige otra mesa u horario.`,
          variant: "destructive",
        });
        return null;
      }
    }

    try {
      const { data, error } = await supabase
        .from('table_reservations')
        .insert({
          ...reservationData,
          duration_minutes: duration,
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
