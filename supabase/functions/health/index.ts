// B-13: chequeo de salud para un monitor externo (UptimeRobot, Better Stack…).
// Público y sin datos sensibles: 200 si la base responde y ningún trabajo
// programado falló en 24 h; 503 en otro caso.
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async () => {
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data, error } = await admin.rpc("ops_health");
    if (error) throw error;
    const failed = (data?.cron_failed_24h ?? []) as string[];
    const ok = data?.db === true && failed.length === 0;
    return new Response(
      JSON.stringify({ status: ok ? "ok" : "degraded", cron_failed_24h: failed, migrations_latest: data?.migrations_latest ?? null }),
      { status: ok ? 200 : 503, headers },
    );
  } catch (e) {
    console.error("health", e);
    return new Response(JSON.stringify({ status: "down" }), { status: 503, headers });
  }
});
