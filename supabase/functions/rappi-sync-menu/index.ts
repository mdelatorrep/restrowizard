// Push restaurant menu to Rappi
import { corsHeaders, jsonResponse, errorResponse, requireUser, requireIntegrationOwnership, rappiFetch, supabaseService } from "../_shared/rappi.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { userId } = await requireUser(req);
    const { integration_id, store_id, menu_id } = await req.json();
    if (!integration_id || !store_id) return errorResponse("integration_id y store_id requeridos", 400);
    await requireIntegrationOwnership(integration_id, userId);

    const sb = supabaseService();

    // Get menu + items
    const itemsQuery = sb.from("menu_items").select("id, name, description, price, category, image_url, is_available, sort_order");
    const { data: items, error } = menu_id
      ? await itemsQuery.eq("menu_id", menu_id)
      : await itemsQuery.in("menu_id",
          (await sb.from("restaurant_menus").select("id").eq("user_id", userId).eq("status", "published")).data?.map(m => m.id) ?? []);
    if (error) throw error;
    if (!items?.length) return errorResponse("No hay items para sincronizar", 400);

    // Build Rappi menu payload (simplified — actual structure per Rappi docs)
    const payload = {
      store_id,
      categories: groupByCategory(items),
    };

    const res = await rappiFetch(integration_id, `/api/v2/restaurants/stores/${store_id}/menu`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    const respBody = await res.json().catch(() => ({}));

    // Upsert sync rows
    const now = new Date().toISOString();
    const syncRows = items.map((it) => ({
      user_id: userId,
      integration_id,
      menu_item_id: it.id,
      store_id,
      external_item_id: it.id,
      status: res.ok ? "synced" : "error",
      last_synced_at: now,
      last_error: res.ok ? null : JSON.stringify(respBody).slice(0, 500),
    }));
    await sb.from("rappi_menu_sync").upsert(syncRows, { onConflict: "integration_id,menu_item_id,store_id" });

    await sb.from("aggregator_integrations").update({
      last_sync_at: now,
      sync_status: { menu: { at: now, ok: res.ok, items: items.length } },
    }).eq("id", integration_id);

    if (!res.ok) return errorResponse(`Rappi rechazó el menú [${res.status}]: ${JSON.stringify(respBody)}`, 502);
    return jsonResponse({ ok: true, items_synced: items.length });
  } catch (e) {
    return errorResponse(e, 500);
  }
});

// deno-lint-ignore no-explicit-any
function groupByCategory(items: any[]) {
  const map = new Map<string, any[]>();
  for (const it of items) {
    const cat = it.category || "general";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push({
      external_id: it.id,
      name: it.name,
      description: it.description ?? "",
      price: Number(it.price ?? 0),
      image_url: it.image_url ?? null,
      is_available: it.is_available !== false,
      sort_order: it.sort_order ?? 0,
    });
  }
  return Array.from(map.entries()).map(([name, products]) => ({ name, products }));
}
