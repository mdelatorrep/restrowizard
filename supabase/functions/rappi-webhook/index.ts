// Public webhook for Rappi events
import { corsHeaders, supabaseService } from "../_shared/rappi.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const integrationId = url.searchParams.get("integration_id");
    const signature = req.headers.get("x-rappi-signature");
    const raw = await req.text();
    const payload = JSON.parse(raw);

    const sb = supabaseService();

    // Resolve integration to validate webhook_secret
    let integ: any = null;
    if (integrationId) {
      const { data } = await sb
        .from("aggregator_integrations")
        .select("id, user_id, webhook_secret, store_ids, brand_id")
        .eq("id", integrationId).maybeSingle();
      integ = data;
    }

    // Best-effort HMAC validation
    if (integ?.webhook_secret && signature) {
      const ok = await verifyHmac(integ.webhook_secret, raw, signature);
      if (!ok) return new Response("Invalid signature", { status: 401 });
    }

    const eventId = payload.event_id ?? payload.id ?? `${Date.now()}-${crypto.randomUUID()}`;
    const eventType = payload.event_type ?? payload.type ?? "unknown";

    // Idempotency
    const { error: insertEventErr } = await sb.from("rappi_webhook_events").insert({
      integration_id: integ?.id ?? null,
      event_id: eventId,
      event_type: eventType,
      payload,
      signature,
    });
    if (insertEventErr && insertEventErr.code === "23505") {
      return new Response("duplicate", { status: 200, headers: corsHeaders });
    }

    if (!integ) return new Response("integration not found", { status: 200, headers: corsHeaders });

    // Process by event type
    if (eventType === "NEW_ORDER" || eventType === "order.created") {
      const order = payload.order ?? payload;
      const externalId = String(order.id ?? order.order_id ?? eventId);
      const orderRow = {
        user_id: integ.user_id,
        brand_id: integ.brand_id,
        platform: "rappi",
        external_order_id: externalId,
        order_status: order.status ?? "pending",
        items: order.items ?? [],
        subtotal: Number(order.subtotal ?? order.total ?? 0),
        commission: Number(order.commission ?? 0),
        net_total: Number(order.net_total ?? order.subtotal ?? 0) - Number(order.commission ?? 0),
        customer_name: order.customer?.name ?? null,
        customer_phone: order.customer?.phone ?? null,
        delivery_address: order.delivery_address ?? order.customer?.address ?? null,
        pickup_code: order.pickup_code ?? null,
        courier_info: order.courier ?? null,
        raw_payload: order,
      };
      await sb.from("aggregator_orders").upsert(orderRow, { onConflict: "platform,external_order_id" });
    } else if (eventType === "STATUS_CHANGE" || eventType === "order.updated") {
      const order = payload.order ?? payload;
      const externalId = String(order.id ?? order.order_id);
      const { data: existing } = await sb.from("aggregator_orders")
        .select("id, status_history").eq("platform", "rappi").eq("external_order_id", externalId).maybeSingle();
      const history = Array.isArray(existing?.status_history) ? existing!.status_history : [];
      history.push({ at: new Date().toISOString(), status: order.status });
      await sb.from("aggregator_orders").update({
        order_status: order.status,
        status_history: history,
        completed_at: ["delivered", "completed"].includes(order.status) ? new Date().toISOString() : null,
      }).eq("platform", "rappi").eq("external_order_id", externalId);
    } else if (eventType === "CANCELLATION" || eventType === "order.cancelled") {
      const order = payload.order ?? payload;
      const externalId = String(order.id ?? order.order_id);
      await sb.from("aggregator_orders").update({
        order_status: "cancelled",
        rejection_reason: order.reason ?? null,
      }).eq("platform", "rappi").eq("external_order_id", externalId);
    }

    await sb.from("rappi_webhook_events").update({ processed: true }).eq("event_id", eventId);

    return new Response("ok", { status: 200, headers: corsHeaders });
  } catch (e) {
    console.error("rappi-webhook error", e);
    return new Response("error", { status: 500, headers: corsHeaders });
  }
});

async function verifyHmac(secret: string, body: string, signature: string): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
    );
    const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
    const hex = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, "0")).join("");
    return signature.toLowerCase().includes(hex);
  } catch { return false; }
}
