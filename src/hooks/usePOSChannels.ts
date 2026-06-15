import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  const [delivery, setDelivery] = useState<AggregatorOrder[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
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
    setDelivery((d.data as AggregatorOrder[]) ?? []);
    setReservations((r.data as Reservation[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!userId) return;
    const sb = supabase as any;
    const ch = sb
      .channel(`pos-channels-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "aggregator_orders", filter: `user_id=eq.${userId}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "table_reservations", filter: `user_id=eq.${userId}` }, load)
      .subscribe();
    return () => {
      sb.removeChannel(ch);
    };
  }, [userId, load]);

  return { delivery, reservations, loading, refresh: load };
}
