import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { qk } from "@/lib/queryKeys";

export interface POSMenuItem {
  id: string;
  menu_id: string;
  name: string;
  description: string | null;
  category: string;
  category_id: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
}

export interface POSCategory {
  id: string | null;
  name: string;
  sort_order: number;
}

interface UsePOSMenuReturn {
  items: POSMenuItem[];
  categories: POSCategory[];
  loading: boolean;
}

/**
 * Live catalog for the POS: items + derived categories.
 * Realtime on menu_items invalida la query para propagar cambios de precio/disponibilidad.
 */
export function usePOSMenu(restaurantUserId: string | undefined): UsePOSMenuReturn {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: qk.pos.menu(restaurantUserId),
    enabled: !!restaurantUserId,
    queryFn: async () => {
      const sb = supabase as any;
      const menusRes = await sb
        .from("restaurant_menus")
        .select("id")
        .eq("user_id", restaurantUserId)
        .eq("status", "published");
      const ids: string[] = (menusRes?.data || []).map((m: any) => m.id);
      if (ids.length === 0) return { items: [] as POSMenuItem[], categories: [] as POSCategory[], menuIds: ids };

      const [itemsRes, catsRes] = await Promise.all([
        sb.from("menu_items")
          .select("id, menu_id, name, description, category, category_id, price, image_url, is_available, sort_order")
          .in("menu_id", ids)
          .order("sort_order"),
        sb.from("menu_categories")
          .select("id, name, sort_order")
          .in("menu_id", ids)
          .order("sort_order"),
      ]);

      const items = (itemsRes?.data || []) as POSMenuItem[];
      const cats: POSCategory[] = (catsRes?.data || []).map((c: any) => ({
        id: c.id, name: c.name, sort_order: c.sort_order ?? 0,
      }));
      const seen = new Set(cats.map((c) => c.name));
      for (const it of items) {
        if (!it.category_id && it.category && !seen.has(it.category)) {
          cats.push({ id: null, name: it.category, sort_order: 999 });
          seen.add(it.category);
        }
      }
      return { items, categories: cats, menuIds: ids };
    },
  });

  const menuIds = data?.menuIds ?? [];

  useRealtimeTable<POSMenuItem>({
    table: "menu_items",
    enabled: menuIds.length > 0,
    onChange: () => queryClient.invalidateQueries({ queryKey: qk.pos.menu(restaurantUserId) }),
  });

  return { items: data?.items ?? [], categories: data?.categories ?? [], loading: isLoading };
}
