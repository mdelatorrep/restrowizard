import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { qk } from '@/lib/queryKeys';

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
  const queryClient = useQueryClient();

  const { data: reservations = [], isLoading: loading } = useQuery({
    queryKey: qk.reservations.all(user?.id),
    enabled: !!user?.id,
    queryFn: async (): Promise<Reservation[]> => {
      const { data, error } = await supabase
        .from('table_reservations')
        .select('*')
        .eq('user_id', user!.id)
        .order('reservation_date', { ascending: true })
        .order('reservation_time', { ascending: true });
      if (error) throw error;
      return (data || []) as Reservation[];
    },
  });

  const kpis = useMemo((): ReservationKPIs => {
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];

    return {
      total: reservations.length,
      pending: reservations.filter(r => r.status === 'pending').length,
      confirmed: reservations.filter(r => r.status === 'confirmed').length,
      todayCount: reservations.filter(r => r.reservation_date === today).length,
      thisWeekCount: reservations.filter(r => r.reservation_date >= weekStartStr).length,
    };
  }, [reservations]);

  const fetchReservations = useCallback(
    () => queryClient.invalidateQueries({ queryKey: qk.reservations.all(user?.id) }),
    [queryClient, user?.id]
  );

  const updateReservationStatus = async (id: string, status: Reservation['status'], notes?: string) => {
    try {
      const updates: Partial<Reservation> = { status };
      if (notes) updates.notes = notes;
      
      const { error } = await supabase
        .from('table_reservations')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      

      // TK-5: sincronizar estado de la mesa con el estado de la reserva
      const reservation = reservations.find(r => r.id === id);
      if (reservation?.table_id) {
        try {
          if (status === 'confirmed' || status === 'pending') {
            // Solo marcar como reservada si está disponible (no pisar 'occupied')
            const { data: table } = await supabase
              .from('restaurant_tables')
              .select('status')
              .eq('id', reservation.table_id)
              .maybeSingle();
            if (table && table.status === 'available') {
              await supabase
                .from('restaurant_tables')
                .update({ status: 'reserved' })
                .eq('id', reservation.table_id);
            }
          } else if (status === 'cancelled' || status === 'no_show' || status === 'completed') {
            // Liberar solo si la mesa estaba reservada (no si tiene pedido activo)
            const { data: table } = await supabase
              .from('restaurant_tables')
              .select('status, current_order_id')
              .eq('id', reservation.table_id)
              .maybeSingle();
            if (table && table.status === 'reserved' && !table.current_order_id) {
              await supabase
                .from('restaurant_tables')
                .update({ status: 'available' })
                .eq('id', reservation.table_id);
            }
          }
        } catch (syncErr) {
          console.error('Error syncing table status:', syncErr);
        }
      }
      
      await fetchReservations();

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
          description: `Ya existe una reserva en esa franja. Elige otra mesa u horario.`,
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

      await fetchReservations();

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
      // B-15: reservas públicas vía edge validada (acepta-reservas, tamaño, ventana, rate-limit)
      const { data, error } = await supabase.functions.invoke('website-public-reservation', {
        body: { restaurant_user_id: restaurantUserId, ...reservationData },
      });

      const code = (data as any)?.confirmation_code as string | undefined;
      if (error || !code) {
        throw new Error((data as any)?.error || error?.message || 'No se pudo crear la reserva');
      }

      toast({
        title: "¡Reserva confirmada!",
        description: `Tu código de confirmación es: ${code}`,
      });

      return code;
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
