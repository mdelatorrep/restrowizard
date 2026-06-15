import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import type { RestaurantTable } from "@/hooks/usePOSTables";

export interface Zone {
  id: string;
  name: string;
}

export interface ActiveOrderSummary {
  id: string;
  table_id: string | null;
  total: number;
  waiter_name: string | null;
  created_at: string;
}

interface UsePOSLiveMapReturn {
  tables: RestaurantTable[];
  zones: Zone[];
  orders: ActiveOrderSummary[];
  loading: boolean;
}

/**
 * Fetches tables, zones and active orders for a given restaurant user_id (resolved from slug)
 * and keeps everything in sync via Supabase Realtime.
 */
export function usePOSLiveMap(restaurantUserId: string | undefined): UsePOSLiveMapReturn {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [orders, setOrders] = useState<ActiveOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!restaurantUserId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // Resolve restaurant_id for zones (which are keyed by restaurant_businesses.id)
        const businessRes: any = await supabase
          .from("restaurant_businesses")
          .select("id")
          .eq("user_id", restaurantUserId)
          .limit(1);
        const businessId: string | undefined = businessRes?.data?.[0]?.id;

        const tablesRes: any = await supabase
          .from("restaurant_tables")
          .select("*")
          .eq("user_id", restaurantUserId)
          .order("table_number");

        let zonesData: Zone[] = [];
        if (businessId) {
          const zonesRes: any = await supabase
            .from("restaurant_zones")
            .select("id, name")
            .eq("restaurant_id", businessId)
            .eq("is_active", true);
          zonesData = (zonesRes?.data || []) as Zone[];
        }

        const ordersRes: any = await supabase
          .from("restaurant_orders")
          .select("id, table_id, total, waiter_name, created_at")
          .eq("user_id", restaurantUserId)
          .not("table_id", "is", null)
          .in("status", ["pending", "preparing", "ready", "served"]);

        if (cancelled) return;
        setTables((tablesRes?.data || []) as RestaurantTable[]);
        setZones(zonesData);
        setOrders((ordersRes?.data || []) as ActiveOrderSummary[]);


      } catch (e) {
        console.error("usePOSLiveMap load error", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [restaurantUserId]);

  // Realtime: tables
  useRealtimeTable<RestaurantTable>({
    table: "restaurant_tables",
    filter: restaurantUserId ? `user_id=eq.${restaurantUserId}` : undefined,
    enabled: !!restaurantUserId,
    onChange: (payload) => {
      if (payload.eventType === "INSERT") {
        setTables((prev) => [...prev, payload.new as RestaurantTable]);
      } else if (payload.eventType === "UPDATE") {
        const n = payload.new as RestaurantTable;
        setTables((prev) => prev.map((t) => (t.id === n.id ? n : t)));
      } else if (payload.eventType === "DELETE") {
        const o = payload.old as RestaurantTable;
        setTables((prev) => prev.filter((t) => t.id !== o.id));
      }
    },
  });

  // Realtime: orders (refetch on any change for simplicity)
  useRealtimeTable<ActiveOrderSummary>({
    table: "restaurant_orders",
    filter: restaurantUserId ? `user_id=eq.${restaurantUserId}` : undefined,
    enabled: !!restaurantUserId,
    onChange: async () => {
      if (!restaurantUserId) return;
      const { data } = await supabase
        .from("restaurant_orders")
        .select("id, table_id, total, waiter_name, created_at")
        .eq("user_id", restaurantUserId)
        .not("table_id", "is", null)
        .in("status", ["pending", "preparing", "ready", "served"]);
      setOrders((data || []) as ActiveOrderSummary[]);
    },
  });

  return { tables, zones, orders, loading };
}
