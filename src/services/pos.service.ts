/**
 * POS service layer — wraps Supabase queries used by the POS page.
 *
 * Goal: incrementally extract logic out of `src/pages/restaurant/POS.tsx`
 * (currently ~950 lines) into typed, testable service functions so the page
 * becomes a thin orchestrator of components + queries.
 */

import { supabase } from "@/integrations/supabase/client";
import { fail, ok, type ServiceResult } from "./_base";

export interface POSOrderItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  notes?: string | null;
  modifiers?: unknown;
}

export interface CreateOrderInput {
  userId: string;
  brandId?: string | null;
  tableId?: string | null;
  waiterId?: string | null;
  orderType: "dine_in" | "takeaway" | "delivery";
  items: POSOrderItem[];
  subtotal: number;
  discount?: number;
  tax?: number;
  tip?: number;
  total: number;
  notes?: string | null;
}

/** Create a new POS order. */
export async function createOrder(input: CreateOrderInput): Promise<ServiceResult<{ id: string; order_number: number }>> {
  const { data, error } = await (supabase as any)
    .from("restaurant_orders")
    .insert({
      user_id: input.userId,
      brand_id: input.brandId ?? null,
      table_id: input.tableId ?? null,
      waiter_id: input.waiterId ?? null,
      order_type: input.orderType,
      items: input.items,
      subtotal: input.subtotal,
      discount: input.discount ?? 0,
      tax: input.tax ?? 0,
      tip_amount: input.tip ?? 0,
      total: input.total,
      kitchen_status: "pending",
      payment_status: "pending",
      notes: input.notes ?? null,
    })
    .select("id, order_number")
    .single();

  if (error) return fail(error.message, error.code, error);
  return ok(data as { id: string; order_number: number });
}

/** List today's open POS orders for a given user. */
export async function listOpenOrders(userId: string): Promise<ServiceResult<any[]>> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from("restaurant_orders")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", start.toISOString())
    .neq("payment_status", "paid")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return fail(error.message, error.code, error);
  return ok(data ?? []);
}

/** Mark order as paid. */
export async function markOrderPaid(orderId: string, paymentMethod: string): Promise<ServiceResult<true>> {
  const { error } = await supabase
    .from("restaurant_orders")
    .update({
      payment_status: "paid",
      payment_method: paymentMethod,
      completed_at: new Date().toISOString(),
    })
    .eq("id", orderId);
  if (error) return fail(error.message, error.code, error);
  return ok(true as const);
}
