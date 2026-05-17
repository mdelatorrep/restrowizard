// Save Rappi credentials + test connection by fetching an access token
import { corsHeaders, encrypt, getAccessToken, jsonResponse, errorResponse, requireUser, supabaseService } from "../_shared/rappi.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { userId } = await requireUser(req);
    const body = await req.json();
    const { action } = body;
    const sb = supabaseService();

    if (action === "save") {
      const { client_id, client_secret, store_ids, environment, brand_id, integration_id, webhook_secret } = body;
      if (!client_id || !client_secret) return errorResponse("client_id y client_secret requeridos", 400);

      const payload: Record<string, unknown> = {
        user_id: userId,
        platform: "rappi",
        client_id,
        client_secret_encrypted: await encrypt(client_secret),
        store_ids: Array.isArray(store_ids) ? store_ids : (store_ids ? [store_ids] : []),
        environment: environment ?? "sandbox",
        brand_id: brand_id ?? null,
        webhook_secret: webhook_secret ?? null,
        access_token_encrypted: null,
        token_expires_at: null,
        is_active: true,
      };

      let row;
      if (integration_id) {
        const { data, error } = await sb.from("aggregator_integrations").update(payload).eq("id", integration_id).eq("user_id", userId).select().single();
        if (error) throw error;
        row = data;
      } else {
        const { data, error } = await sb.from("aggregator_integrations").insert(payload).select().single();
        if (error) throw error;
        row = data;
      }
      return jsonResponse({ ok: true, integration: { ...row, client_secret_encrypted: undefined, access_token_encrypted: undefined } });
    }

    if (action === "test") {
      const { integration_id } = body;
      if (!integration_id) return errorResponse("integration_id requerido", 400);
      // Ownership check
      const { data: integ } = await sb.from("aggregator_integrations").select("user_id").eq("id", integration_id).maybeSingle();
      if (!integ || integ.user_id !== userId) return errorResponse("Forbidden", 403);
      const token = await getAccessToken(integration_id);
      return jsonResponse({ ok: true, token_preview: token.slice(0, 8) + "..." });
    }

    return errorResponse("Acción desconocida", 400);
  } catch (e) {
    return errorResponse(e, 500);
  }
});
