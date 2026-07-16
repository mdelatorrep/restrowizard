/**
 * B-26 — Guardia para funciones de sincronización programada.
 *
 * `rappi-orders-poll` y `rappi-settlements-sync` corren con SERVICE_ROLE (saltan
 * RLS) y recorren las integraciones de TODOS los tenants. Estaban con
 * `verify_jwt = false` y sin ninguna validación: cualquiera en internet podía
 * dispararlas. Eso permitía:
 *   - agotar el rate-limit (y la cuota) de la API de Rappi de todos los clientes,
 *   - forzar N×M llamadas externas por request (DoS amplificado),
 *   - y en orders-poll, leer en la respuesta los IDs de integración y de store
 *     de todos los negocios.
 *
 * No pueden exigir JWT de usuario porque las invoca un cron, no una persona.
 * La guardia correcta es un secreto compartido.
 */

/** Comparación en tiempo constante (mismo patrón que el HMAC de B-14). */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Exige el secreto de cron. Devuelve `null` si pasa, o una Response de error.
 *
 * El secreto viaja en `x-cron-secret` (o `Authorization: Bearer <secreto>`).
 * Si `CRON_SECRET` no está configurado, se RECHAZA: una función que mueve datos
 * de todos los tenants no debe quedar abierta por un env var faltante.
 */
export function requireCron(req: Request, corsHeaders: Record<string, string>): Response | null {
  const expected = Deno.env.get("CRON_SECRET");

  if (!expected) {
    console.error("CRON_SECRET no configurado — se rechaza la invocación");
    return new Response(
      JSON.stringify({ error: "Service not configured" }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const provided =
    req.headers.get("x-cron-secret") ??
    (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");

  if (!provided || !timingSafeEqual(provided, expected)) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  return null;
}
