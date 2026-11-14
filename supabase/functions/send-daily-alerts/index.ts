// C-10: envía a cada dueño, por correo, las alertas que generate_daily_alerts()
// creó hoy. Lo dispara el cron 'daily-alerts-email' con el secreto de cron.
//
// Proveedor de correo: Resend (https://resend.com). Requiere los secretos
// RESEND_API_KEY y ALERTS_FROM_EMAIL (p. ej. "RestroWizard <alertas@restrowizard.co>").
// Sin ellos la función no envía nada y responde qué faltó: las alertas siguen
// visibles en el panel.
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireCron } from "../_shared/require-cron.ts";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, x-cron-secret" };
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://restrowizard.co";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const denied = requireCron(req, corsHeaders);
  if (denied) return denied;

  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("ALERTS_FROM_EMAIL");
  if (!apiKey || !from) {
    return json({ sent: 0, skipped: "Falta RESEND_API_KEY o ALERTS_FROM_EMAIL" });
  }

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const since = new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString();
  const { data: alerts, error } = await admin
    .from("copilot_alerts")
    .select("id, user_id, title, message, action_url, priority, data")
    .in("alert_type", ["daily_sales_drop", "low_stock"])
    .gte("created_at", since)
    .is("data->>emailed_at", null);
  if (error) return json({ error: error.message }, 500);

  const byOwner = new Map<string, typeof alerts>();
  for (const a of alerts ?? []) {
    byOwner.set(a.user_id, [...(byOwner.get(a.user_id) ?? []), a]);
  }

  let sent = 0;
  for (const [ownerId, list] of byOwner) {
    const { data: settings } = await admin.from("alert_settings").select("email_enabled").eq("user_id", ownerId).maybeSingle();
    if (settings && settings.email_enabled === false) continue;

    const { data: u } = await admin.auth.admin.getUserById(ownerId);
    const to = u?.user?.email;
    if (!to || to.endsWith("@pos.restrowizard.app")) continue;

    const items = list!
      .map((a) => `<li style="margin-bottom:12px"><strong>${esc(a.title)}</strong><br>${esc(a.message)}<br>` +
        `<a href="${SITE_URL}${a.action_url ?? "/r/dashboard"}">Ver detalle</a></li>`)
      .join("");
    const html = `<div style="font-family:Arial,sans-serif;max-width:560px">
      <p>Buenos días. Esto se salió de rango ayer en tu restaurante:</p><ul>${items}</ul>
      <p style="color:#666;font-size:12px">Cambia los umbrales o apaga este correo en ${SITE_URL}/r/settings.</p></div>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject: `${list!.length} alerta${list!.length > 1 ? "s" : ""} de tu restaurante`, html }),
    });
    if (!res.ok) {
      console.error("send-daily-alerts: Resend", res.status, await res.text());
      continue;
    }
    sent++;
    const stamp = new Date().toISOString();
    for (const a of list!) {
      await admin.from("copilot_alerts").update({ data: { ...(a.data as object), emailed_at: stamp } }).eq("id", a.id);
    }
  }
  return json({ sent, owners: byOwner.size });
});

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
