import { supabase } from "@/integrations/supabase/client";
import { fail, ok, type ServiceResult } from "./_base";

export interface UnifiedOrder {
  id: string;
  user_id: string;
  brand_id: string | null;
  channel: "inhouse" | "aggregator";
  source: string;
  order_type: string | null;
  status: string;
  payment_status: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  items: unknown;
  subtotal: number | null;
  discount: number | null;
  tax: number | null;
  delivery_fee: number | null;
  tip_amount: number | null;
  commission: number | null;
  gross_total: number | null;
  net_total: number | null;
  created_at: string;
  completed_at: string | null;
  updated_at: string | null;
  external_order_id: string | null;
  table_id: string | null;
  session_id: string | null;
  waiter_id: string | null;
}

export interface ListOrdersParams {
  userId: string;
  from?: string;
  to?: string;
  channel?: "inhouse" | "aggregator";
  source?: string;
  status?: string;
  limit?: number;
}

/**
 * List orders from the unified view that consolidates POS, dine-in, delivery
 * and aggregator (Rappi/UberEats/DiDi) sources.
 */
export async function listUnifiedOrders(params: ListOrdersParams): Promise<ServiceResult<UnifiedOrder[]>> {
  let q = (supabase as any)
    .from("unified_orders_view")
    .select("*")
    .eq("user_id", params.userId)
    .order("created_at", { ascending: false })
    .limit(params.limit ?? 200);

  if (params.from) q = q.gte("created_at", params.from);
  if (params.to) q = q.lte("created_at", params.to);
  if (params.channel) q = q.eq("channel", params.channel);
  if (params.source) q = q.eq("source", params.source);
  if (params.status) q = q.eq("status", params.status);

  const { data, error } = await q;
  if (error) return fail<UnifiedOrder[]>(error.message, error.code, error);
  return ok((data ?? []) as UnifiedOrder[]);
}

/**
 * Lifecycle history for a single order (auto-logged by trg_log_order_status_change).
 */
export async function getOrderStatusHistory(orderId: string) {
  const { data, error } = await supabase
    .from("order_status_history")
    .select("id, status, changed_by, notes, created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });
  if (error) return fail(error.message, error.code, error);
  return ok(data ?? []);
}
