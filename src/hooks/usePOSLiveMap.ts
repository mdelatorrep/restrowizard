import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import type { RestaurantTable } from "@/hooks/usePOSTables";
import { qk } from "@/lib/queryKeys";

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

export function usePOSLiveMap(restaurantUserId: string | undefined): UsePOSLiveMapReturn {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: qk.pos.liveMap(restaurantUserId),
    enabled: !!restaurantUserId,
    queryFn: async () => {
      const sb = supabase as any;
      const businessRes = await sb
        .from("restaurant_businesses").select("id").eq("user_id", restaurantUserId).limit(1);
      const businessId: string | undefined = businessRes?.data?.[0]?.id;

      const tablesRes = await sb
        .from("restaurant_tables").select("*").eq("user_id", restaurantUserId).order("table_number");

      let zonesData: Zone[] = [];
      if (businessId) {
        const zonesRes = await sb
          .from("restaurant_zones").select("id, name").eq("restaurant_id", businessId).eq("is_active", true);
        zonesData = (zonesRes?.data || []) as Zone[];
      }

      const ordersRes = await sb
        .from("restaurant_orders")
        .select("id, table_id, total, waiter_name, created_at")
        .eq("user_id", restaurantUserId)
        .not("table_id", "is", null)
        .in("status", ["pending", "preparing", "ready", "served"]);

      return {
        tables: (tablesRes?.data || []) as RestaurantTable[],
        zones: zonesData,
        orders: (ordersRes?.data || []) as ActiveOrderSummary[],
      };
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk.pos.liveMap(restaurantUserId) });

  useRealtimeTable<RestaurantTable>({
    table: "restaurant_tables",
    filter: restaurantUserId ? `user_id=eq.${restaurantUserId}` : undefined,
    enabled: !!restaurantUserId,
    onChange: invalidate,
  });

  useRealtimeTable<ActiveOrderSummary>({
    table: "restaurant_orders",
    filter: restaurantUserId ? `user_id=eq.${restaurantUserId}` : undefined,
    enabled: !!restaurantUserId,
    onChange: invalidate,
  });

  return {
    tables: data?.tables ?? [],
    zones: data?.zones ?? [],
    orders: data?.orders ?? [],
    loading: isLoading,
  };
}
