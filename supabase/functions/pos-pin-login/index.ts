// POS PIN Login — validates a 4-6 digit PIN against staff_members for a given restaurant slug
// Returns a magic-link token_hash that the client exchanges via verifyOtp to establish a session.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const BodySchema = z.object({
  slug: z.string().min(1).max(120),
  pin: z.string().regex(/^[0-9]{4,6}$/),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ error: "Datos inválidos", details: parsed.error.flatten() }, 400);
    }
    const { slug, pin } = parsed.data;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1) Resolve slug → owner user_id via restaurant_websites
    const { data: site, error: siteErr } = await admin
      .from("restaurant_websites")
      .select("user_id, slug, is_published")
      .eq("slug", slug)
      .maybeSingle();

    if (siteErr) throw siteErr;
    if (!site) return json({ error: "Restaurante no encontrado" }, 404);

    // 2) Verify PIN via SECURITY DEFINER function
    const { data: matches, error: verifyErr } = await admin.rpc("verify_staff_pin", {
      _restaurant_user_id: site.user_id,
      _pin: pin,
    });

    if (verifyErr) throw verifyErr;
    if (!matches || matches.length === 0) {
      return json({ error: "PIN inválido" }, 401);
    }

    const staff = matches[0];

    // 3) Require a linked auth user. If not linked, owner must link it from admin.
    if (!staff.linked_user_id) {
      return json(
        {
          error:
            "Este empleado no tiene cuenta vinculada. El administrador debe vincular una cuenta de usuario para habilitar el PIN.",
        },
        409,
      );
    }

    // 4) Fetch the linked auth user's email
    const { data: authUser, error: userErr } = await admin.auth.admin.getUserById(
      staff.linked_user_id,
    );
    if (userErr || !authUser?.user?.email) {
      return json({ error: "Cuenta vinculada inválida" }, 500);
    }

    // 5) Generate a magic-link token the client can exchange via verifyOtp
    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: authUser.user.email,
    });

    if (linkErr || !link?.properties?.hashed_token) {
      console.error("generateLink error", linkErr);
      return json({ error: "No se pudo generar la sesión" }, 500);
    }

    return json({
      token_hash: link.properties.hashed_token,
      email: authUser.user.email,
      staff: {
        id: staff.staff_id,
        name: staff.staff_name,
        pos_role: staff.pos_role,
      },
      restaurant_user_id: site.user_id,
    });
  } catch (e) {
    console.error("pos-pin-login error", e);
    return json({ error: "Error interno" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
