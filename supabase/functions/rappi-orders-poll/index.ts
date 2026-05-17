// Polling fallback: fetch new orders from Rappi for each active integration
import { corsHeaders, supabaseService, rappiFetch } from "../_shared/rappi.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const sb = supabaseService();
    const { data: integrations } = await sb
      .from("aggregator_integrations")
      .select("id, user_id, brand_id, store_ids")
      .eq("platform", "rappi")
      .eq("is_active", true);

    const results: Record<string, unknown>[] = [];
    for (const integ of integrations ?? []) {
      for (const storeId of integ.store_ids ?? []) {
        try {
          const res = await rappiFetch(integ.id, `/api/v2/restaurants/stores/${storeId}/orders?status=NEW`);
          if (!res.ok) { results.push({ integration: integ.id, store: storeId, error: res.status }); continue; }
          const body = await res.json();
          const orders = body.orders ?? body.data ?? [];
          for (const order of orders) {
            const externalId = String(order.id ?? order.order_id);
            await sb.from("aggregator_orders").upsert({
              user_id: integ.user_id,
              brand_id: integ.brand_id,
              platform: "rappi",
              external_order_id: externalId,
              order_status: order.status ?? "pending",
              items: order.items ?? [],
              subtotal: Number(order.subtotal ?? 0),
              commission: Number(order.commission ?? 0),
              net_total: Number(order.subtotal ?? 0) - Number(order.commission ?? 0),
              customer_name: order.customer?.name ?? null,
              customer_phone: order.customer?.phone ?? null,
              delivery_address: order.delivery_address ?? null,
              raw_payload: order,
            }, { onConflict: "platform,external_order_id" });
          }
          results.push({ integration: integ.id, store: storeId, orders: orders.length });
        } catch (e) {
          results.push({ integration: integ.id, store: storeId, error: String(e) });
        }
      }
    }
    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
