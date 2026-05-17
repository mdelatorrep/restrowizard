// Accept / reject / mark ready / delivered for a Rappi order
import { corsHeaders, jsonResponse, errorResponse, requireUser, rappiFetch, supabaseService } from "../_shared/rappi.ts";
import { z, validateBody } from "../_shared/validate.ts";

const ACTIONS: Record<string, { method: string; path: (id: string) => string; body?: any }> = {
  accept: { method: "POST", path: id => `/api/v2/restaurants/orders/${id}/accept` },
  reject: { method: "POST", path: id => `/api/v2/restaurants/orders/${id}/reject` },
  ready: { method: "POST", path: id => `/api/v2/restaurants/orders/${id}/ready` },
  delivered: { method: "POST", path: id => `/api/v2/restaurants/orders/${id}/delivered` },
};

const BodySchema = z.object({
  order_id: z.string().uuid(),
  action: z.enum(["accept", "reject", "ready", "delivered"]),
  reason: z.string().trim().max(500).optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { userId } = await requireUser(req);
    const parsed = await validateBody(req, BodySchema);
    if (parsed.error) return parsed.error;
    const { order_id, action, reason } = parsed.data;
    const map = ACTIONS[action];

    const sb = supabaseService();
    const { data: order } = await sb.from("aggregator_orders")
      .select("id, user_id, external_order_id, status_history, brand_id")
      .eq("id", order_id).maybeSingle();
    if (!order || order.user_id !== userId) return errorResponse("Forbidden", 403);

    // Find integration for this user (single rappi integration per brand or any)
    const { data: integ } = await sb.from("aggregator_integrations")
      .select("id").eq("user_id", userId).eq("platform", "rappi").eq("is_active", true)
      .limit(1).maybeSingle();
    if (!integ) return errorResponse("Sin integración Rappi activa", 400);

    const res = await rappiFetch(integ.id, map.path(order.external_order_id!), {
      method: map.method,
      body: JSON.stringify({ reason }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return errorResponse(`Rappi error [${res.status}]: ${JSON.stringify(body)}`, 502);

    const history = Array.isArray(order.status_history) ? order.status_history : [];
    history.push({ at: new Date().toISOString(), action });
    const statusMap: Record<string, string> = { accept: "accepted", reject: "cancelled", ready: "ready", delivered: "delivered" };
    await sb.from("aggregator_orders").update({
      order_status: statusMap[action],
      status_history: history,
      rejection_reason: action === "reject" ? reason ?? null : null,
      completed_at: action === "delivered" ? new Date().toISOString() : null,
    }).eq("id", order_id);

    return jsonResponse({ ok: true });
  } catch (e) {
    return errorResponse(e, 500);
  }
});
