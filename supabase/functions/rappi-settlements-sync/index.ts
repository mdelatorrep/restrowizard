// Daily settlements sync from Rappi
import { corsHeaders, supabaseService, rappiFetch } from "../_shared/rappi.ts";
import { requireCron } from "../_shared/require-cron.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // B-26: corre con SERVICE_ROLE sobre TODOS los tenants -> no puede ser anónima.
  const denied = requireCron(req, corsHeaders);
  if (denied) return denied;

  try {
    const sb = supabaseService();
    const { data: integrations } = await sb
      .from("aggregator_integrations")
      .select("id, user_id, store_ids")
      .eq("platform", "rappi").eq("is_active", true);

    const today = new Date();
    const dateFrom = new Date(today.getTime() - 7 * 86400000).toISOString().slice(0, 10);
    const dateTo = today.toISOString().slice(0, 10);

    for (const integ of integrations ?? []) {
      for (const storeId of integ.store_ids ?? []) {
        const res = await rappiFetch(integ.id, `/api/v2/restaurants/stores/${storeId}/settlements?from=${dateFrom}&to=${dateTo}`);
        if (!res.ok) continue;
        const body = await res.json();
        const settlements = body.settlements ?? body.data ?? [];
        for (const s of settlements) {
          await sb.from("rappi_settlements").upsert({
            user_id: integ.user_id,
            integration_id: integ.id,
            store_id: storeId,
            settlement_date: s.date,
            gross_amount: Number(s.gross_amount ?? 0),
            commission_amount: Number(s.commission_amount ?? 0),
            net_amount: Number(s.net_amount ?? 0),
            orders_count: Number(s.orders_count ?? 0),
            currency: s.currency ?? "COP",
            raw_payload: s,
          }, { onConflict: "integration_id,store_id,settlement_date" });
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
