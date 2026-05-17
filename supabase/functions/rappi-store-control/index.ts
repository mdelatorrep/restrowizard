// Open / close / pause Rappi store
import { corsHeaders, jsonResponse, errorResponse, requireUser, requireIntegrationOwnership, rappiFetch, supabaseService } from "../_shared/rappi.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { userId } = await requireUser(req);
    const { integration_id, store_id, status, reason, pause_until, schedule } = await req.json();
    if (!integration_id || !store_id || !status) return errorResponse("Faltan parámetros", 400);
    await requireIntegrationOwnership(integration_id, userId);

    let path = `/api/v2/restaurants/stores/${store_id}/status`;
    let payload: Record<string, unknown> = { status };
    if (status === "paused") payload = { status: "paused", reason, pause_until };
    if (status === "schedule") {
      path = `/api/v2/restaurants/stores/${store_id}/schedule`;
      payload = { schedule };
    }

    const res = await rappiFetch(integration_id, path, { method: "PUT", body: JSON.stringify(payload) });
    const body = await res.json().catch(() => ({}));

    const sb = supabaseService();
    await sb.from("rappi_store_status").insert({
      user_id: userId, integration_id, store_id, status,
      reason: reason ?? null, pause_until: pause_until ?? null,
    });

    if (!res.ok) return errorResponse(`Rappi error [${res.status}]: ${JSON.stringify(body)}`, 502);
    return jsonResponse({ ok: true });
  } catch (e) {
    return errorResponse(e, 500);
  }
});
