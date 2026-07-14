import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResReq {
  restaurant_user_id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  party_size: number;
  reservation_date: string; // YYYY-MM-DD
  reservation_time: string; // HH:MM
  special_requests?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
    const body = (await req.json()) as ResReq;

    if (!body.restaurant_user_id || !body.customer_name?.trim() || !body.customer_phone?.trim() ||
        !body.party_size || !body.reservation_date || !body.reservation_time) {
      return json({ error: "Faltan datos obligatorios" }, 400);
    }
    if (body.customer_phone.trim().length < 7) return json({ error: "Teléfono inválido" }, 400);
    if (body.party_size < 1 || body.party_size > 100) return json({ error: "Tamaño de grupo inválido" }, 400);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // 1) El restaurante acepta reservas y está publicado
    const { data: site } = await supabase
      .from("restaurant_websites")
      .select("show_reservations, reservation_max_party_size, reservation_advance_days, is_published")
      .eq("user_id", body.restaurant_user_id)
      .eq("is_published", true)
      .maybeSingle();
    if (!site) return json({ error: "Restaurante no encontrado" }, 404);
    if (!site.show_reservations) return json({ error: "Este restaurante no acepta reservas en línea" }, 400);

    // 2) Tamaño de grupo
    if (site.reservation_max_party_size && body.party_size > site.reservation_max_party_size) {
      return json({ error: `El máximo por reserva es ${site.reservation_max_party_size} personas` }, 400);
    }

    // 3) Ventana de fecha
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const resDate = new Date(body.reservation_date + "T00:00:00");
    if (isNaN(resDate.getTime()) || resDate < today) return json({ error: "Fecha inválida o pasada" }, 400);
    const maxDays = site.reservation_advance_days ?? 60;
    const maxDate = new Date(today); maxDate.setDate(maxDate.getDate() + maxDays);
    if (resDate > maxDate) return json({ error: `Solo se puede reservar con ${maxDays} días de anticipación` }, 400);

    // 4) Rate limit: máx 3 solicitudes por teléfono en 10 min para este restaurante
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("table_reservations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", body.restaurant_user_id)
      .eq("customer_phone", body.customer_phone.trim())
      .gte("created_at", since);
    if ((count ?? 0) >= 3) return json({ error: "Demasiadas solicitudes. Intenta más tarde." }, 429);

    // 5) Crear la reserva (service role)
    const { data: reservation, error } = await supabase
      .from("table_reservations")
      .insert({
        user_id: body.restaurant_user_id,
        customer_name: body.customer_name.trim().slice(0, 100),
        customer_email: body.customer_email?.trim().slice(0, 255) || null,
        customer_phone: body.customer_phone.trim().slice(0, 20),
        party_size: Math.floor(body.party_size),
        reservation_date: body.reservation_date,
        reservation_time: body.reservation_time,
        special_requests: body.special_requests?.trim().slice(0, 500) || null,
        source: "website",
        status: "pending",
      })
      .select("confirmation_code")
      .single();

    if (error) {
      console.error("reservation insert error", error);
      return json({ error: "No se pudo crear la reserva" }, 500);
    }

    return json({ ok: true, confirmation_code: reservation.confirmation_code });
  } catch (e) {
    console.error("website-public-reservation error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
