import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";

export interface POSOrderLine {
  line_id: string;
  menu_item_id: string;
  name: string;
  unit_price: number;
  quantity: number;
  notes?: string;
  modifiers?: { name: string; price: number }[];
  status: "pending" | "sent" | "ready" | "delivered";
  added_at: string;
}

export interface POSOrder {
  id: string;
  user_id: string;
  table_id: string | null;
  waiter_name: string | null;
  guests_count: number;
  items: POSOrderLine[];
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  tip_amount: number;
  total: number;
  kitchen_status: string;
  payment_status: string;
  status: string;
  created_at: string;
}

function recalcTotals(items: POSOrderLine[]) {
  const subtotal = items.reduce((sum, it) => {
    const mods = (it.modifiers || []).reduce((s, m) => s + (m.price || 0), 0);
    return sum + (it.unit_price + mods) * it.quantity;
  }, 0);
  return { subtotal, total: subtotal };
}

interface UsePOSOrderReturn {
  order: POSOrder | null;
  loading: boolean;
  ensureOrder: (params: {
    tableId: string;
    guests?: number;
    waiterName?: string | null;
  }) => Promise<POSOrder | null>;
  addItem: (item: Omit<POSOrderLine, "line_id" | "added_at" | "status">) => Promise<void>;
  updateQuantity: (lineId: string, qty: number) => Promise<void>;
  updateNotes: (lineId: string, notes: string) => Promise<void>;
  removeItem: (lineId: string, reason?: string) => Promise<void>;
  sendToKitchen: () => Promise<void>;
  markLineStatus: (lineId: string, status: POSOrderLine["status"]) => Promise<void>;
  refresh: () => Promise<void>;
}

export function usePOSOrder(
  restaurantUserId: string | undefined,
  tableId: string | null,
): UsePOSOrderReturn {
  const [order, setOrder] = useState<POSOrder | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!restaurantUserId || !tableId) {
      setOrder(null);
      return;
    }
    setLoading(true);
    try {
      const sb = supabase as any;
      const { data } = await sb
        .from("restaurant_orders")
        .select("*")
        .eq("user_id", restaurantUserId)
        .eq("table_id", tableId)
        .in("status", ["pending", "preparing", "ready", "served"])
        .neq("payment_status", "paid")
        .order("created_at", { ascending: false })
        .limit(1);
      const row = data?.[0];
      if (row) {
        const items = Array.isArray(row.items) ? (row.items as POSOrderLine[]) : [];
        setOrder({ ...(row as POSOrder), items });
      } else {
        setOrder(null);
      }
    } finally {
      setLoading(false);
    }
  }, [restaurantUserId, tableId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  useRealtimeTable({
    table: "restaurant_orders",
    filter: restaurantUserId ? `user_id=eq.${restaurantUserId}` : undefined,
    enabled: !!restaurantUserId && !!tableId,
    onChange: (payload) => {
      const row: any = payload.new || payload.old;
      if (row?.table_id === tableId) fetchOrder();
    },
  });

  const persist = async (next: POSOrder) => {
    const { subtotal, total } = recalcTotals(next.items);
    const updated: POSOrder = {
      ...next,
      subtotal,
      total: total + (next.tax_amount || 0) + (next.tip_amount || 0) - (next.discount_amount || 0),
    };
    setOrder(updated);
    const sb = supabase as any;
    await sb
      .from("restaurant_orders")
      .update({
        items: updated.items,
        subtotal: updated.subtotal,
        total: updated.total,
        updated_at: new Date().toISOString(),
      })
      .eq("id", updated.id);
  };

  const ensureOrder: UsePOSOrderReturn["ensureOrder"] = async ({
    tableId: tId,
    guests = 1,
    waiterName = null,
  }) => {
    if (!restaurantUserId) return null;
    if (order) return order;
    const sb = supabase as any;
    const { data, error } = await sb
      .from("restaurant_orders")
      .insert({
        user_id: restaurantUserId,
        table_id: tId,
        guests_count: guests,
        waiter_name: waiterName,
        order_type: "dine_in",
        sales_channel: "pos",
        is_pos_order: true,
        status: "pending",
        kitchen_status: "pending",
        payment_status: "pending",
        items: [],
        subtotal: 0,
        total: 0,
      })
      .select("*")
      .single();
    if (error) {
      console.error("ensureOrder error", error);
      return null;
    }
    // mark table occupied
    await sb
      .from("restaurant_tables")
      .update({ status: "occupied" })
      .eq("id", tId);
    const fresh = { ...(data as POSOrder), items: [] };
    setOrder(fresh);
    return fresh;
  };

  const addItem: UsePOSOrderReturn["addItem"] = async (item) => {
    if (!order) return;
    const existingIdx = order.items.findIndex(
      (i) =>
        i.menu_item_id === item.menu_item_id &&
        i.status === "pending" &&
        !i.notes &&
        !(i.modifiers && i.modifiers.length),
    );
    const next = [...order.items];
    if (existingIdx >= 0) {
      next[existingIdx] = {
        ...next[existingIdx],
        quantity: next[existingIdx].quantity + item.quantity,
      };
    } else {
      next.push({
        ...item,
        line_id: crypto.randomUUID(),
        status: "pending",
        added_at: new Date().toISOString(),
      });
    }
    await persist({ ...order, items: next });
  };

  const updateQuantity: UsePOSOrderReturn["updateQuantity"] = async (lineId, qty) => {
    if (!order) return;
    const next = order.items
      .map((i) => (i.line_id === lineId ? { ...i, quantity: qty } : i))
      .filter((i) => i.quantity > 0);
    await persist({ ...order, items: next });
  };

  const updateNotes: UsePOSOrderReturn["updateNotes"] = async (lineId, notes) => {
    if (!order) return;
    const next = order.items.map((i) => (i.line_id === lineId ? { ...i, notes } : i));
    await persist({ ...order, items: next });
  };

  const removeItem: UsePOSOrderReturn["removeItem"] = async (lineId, _reason) => {
    if (!order) return;
    // TODO(F3): if status !== 'pending', escalar a supervisor con motivo
    const next = order.items.filter((i) => i.line_id !== lineId);
    await persist({ ...order, items: next });
  };

  const sendToKitchen: UsePOSOrderReturn["sendToKitchen"] = async () => {
    if (!order) return;
    const next = order.items.map((i) =>
      i.status === "pending" ? { ...i, status: "sent" as const } : i,
    );
    const sb = supabase as any;
    setOrder({ ...order, items: next, kitchen_status: "preparing" });
    await sb
      .from("restaurant_orders")
      .update({
        items: next,
        kitchen_status: "preparing",
        kitchen_started_at: new Date().toISOString(),
        status: "preparing",
      })
      .eq("id", order.id);
  };

  const markLineStatus: UsePOSOrderReturn["markLineStatus"] = async (lineId, status) => {
    if (!order) return;
    const next = order.items.map((i) => (i.line_id === lineId ? { ...i, status } : i));
    await persist({ ...order, items: next });
  };

  return {
    order,
    loading,
    ensureOrder,
    addItem,
    updateQuantity,
    updateNotes,
    removeItem,
    sendToKitchen,
    markLineStatus,
    refresh: fetchOrder,
  };
}
