import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";

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
 * Subscribes to menu_items realtime so price/availability changes propagate without reload.
 */
export function usePOSMenu(restaurantUserId: string | undefined): UsePOSMenuReturn {
  const [items, setItems] = useState<POSMenuItem[]>([]);
  const [categories, setCategories] = useState<POSCategory[]>([]);
  const [menuIds, setMenuIds] = useState<string[]>([]);
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
        const sb = supabase as any;
        const menusRes = await sb
          .from("restaurant_menus")
          .select("id")
          .eq("user_id", restaurantUserId)
          .eq("status", "published");
        const ids: string[] = (menusRes?.data || []).map((m: any) => m.id);
        setMenuIds(ids);
        if (ids.length === 0) {
          setItems([]);
          setCategories([]);
          setLoading(false);
          return;
        }
        const [itemsRes, catsRes] = await Promise.all([
          sb
            .from("menu_items")
            .select(
              "id, menu_id, name, description, category, category_id, price, image_url, is_available, sort_order",
            )
            .in("menu_id", ids)
            .order("sort_order"),
          sb
            .from("menu_categories")
            .select("id, name, sort_order")
            .in("menu_id", ids)
            .order("sort_order"),
        ]);
        if (cancelled) return;
        setItems((itemsRes?.data || []) as POSMenuItem[]);
        const cats: POSCategory[] = (catsRes?.data || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          sort_order: c.sort_order ?? 0,
        }));
        // Also derive categories from items.category for items without category_id
        const seen = new Set(cats.map((c) => c.name));
        for (const it of (itemsRes?.data || []) as POSMenuItem[]) {
          if (!it.category_id && it.category && !seen.has(it.category)) {
            cats.push({ id: null, name: it.category, sort_order: 999 });
            seen.add(it.category);
          }
        }
        setCategories(cats);
      } catch (e) {
        console.error("usePOSMenu load error", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [restaurantUserId]);

  // Realtime menu items
  useRealtimeTable<POSMenuItem>({
    table: "menu_items",
    enabled: menuIds.length > 0,
    onChange: (payload) => {
      const row = (payload.new || payload.old) as POSMenuItem;
      if (!row || !menuIds.includes(row.menu_id)) return;
      if (payload.eventType === "INSERT") {
        setItems((prev) => [...prev, payload.new as POSMenuItem]);
      } else if (payload.eventType === "UPDATE") {
        const n = payload.new as POSMenuItem;
        setItems((prev) => prev.map((i) => (i.id === n.id ? n : i)));
      } else if (payload.eventType === "DELETE") {
        const o = payload.old as POSMenuItem;
        setItems((prev) => prev.filter((i) => i.id !== o.id));
      }
    },
  });

  return { items, categories, loading };
}
