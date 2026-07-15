import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { qk } from "@/lib/queryKeys";

export interface AggregatorOrder {
  id: string;
  external_order_id: string | null;
  provider: string;
  status: string;
  total: number | null;
  customer_name: string | null;
  items: any;
  created_at: string;
  estimated_delivery_at: string | null;
}

export interface Reservation {
  id: string;
  customer_name: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  status: string;
  table_id: string | null;
  notes: string | null;
}

export function usePOSChannels(userId: string | null) {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: qk.pos.channels(userId),
    enabled: !!userId,
    queryFn: async () => {
      const sb = supabase as any;
      const today = new Date().toISOString().slice(0, 10);
      const [d, r] = await Promise.all([
        sb.from("aggregator_orders")
          .select("*")
          .eq("user_id", userId)
          .in("status", ["new", "accepted", "preparing", "ready"])
          .order("created_at", { ascending: false })
          .limit(30),
        sb.from("table_reservations")
          .select("*")
          .eq("user_id", userId)
          .eq("reservation_date", today)
          .in("status", ["confirmed", "pending", "seated"])
          .order("reservation_time", { ascending: true }),
      ]);
      return {
        delivery: (d.data as AggregatorOrder[]) ?? [],
        reservations: (r.data as Reservation[]) ?? [],
      };
    },
  });

  // Realtime: invalida la query en cambios (B-06: comparte caché vía TanStack Query)
  useEffect(() => {
    if (!userId) return;
    const sb = supabase as any;
    const invalidate = () => queryClient.invalidateQueries({ queryKey: qk.pos.channels(userId) });
    const ch = sb
      .channel(`pos-channels-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "aggregator_orders", filter: `user_id=eq.${userId}` }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "table_reservations", filter: `user_id=eq.${userId}` }, invalidate)
      .subscribe();
    return () => {
      sb.removeChannel(ch);
    };
  }, [userId, queryClient]);

  return {
    delivery: data?.delivery ?? [],
    reservations: data?.reservations ?? [],
    loading: isLoading,
    refresh: refetch,
  };
}
