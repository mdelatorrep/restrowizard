// Phase 3.1 — OCR de facturas (multimodal vía Lovable AI Gateway)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { safeParseJson } from "../_shared/ai-gateway.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const VISION_MODEL = "google/gemini-2.5-flash";

const SYSTEM_PROMPT = `Eres un asistente que extrae información estructurada de facturas de proveedores de restaurantes en Latinoamérica.
Devuelve SIEMPRE JSON válido con esta forma exacta:
{
  "supplier_name": string | null,
  "invoice_number": string | null,
  "invoice_date": "YYYY-MM-DD" | null,
  "due_date": "YYYY-MM-DD" | null,
  "currency": string,              // ISO ej. "COP","MXN","USD"
  "subtotal": number | null,
  "tax_amount": number | null,
  "total_amount": number | null,
  "items": [
    { "description": string, "quantity": number | null, "unit": string | null, "unit_price": number | null, "total": number | null }
  ],
  "confidence": number,            // 0..1
  "notes": string | null
}
Reglas:
- Convierte fechas a YYYY-MM-DD. Si dudas, deja null.
- Usa punto decimal. No incluyas símbolos de moneda en los números.
- Si la imagen no es una factura, responde con todos los campos en null y confidence: 0.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Missing Authorization" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_KEY) return json({ error: "LOVABLE_API_KEY no configurado" }, 500);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
    const requesterId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const body = await req.json().catch(() => ({}));
    const {
      image_base64,         // "data:image/jpeg;base64,...."  o solo base64
      mime_type = "image/jpeg",
      storage_path,         // alternativa: ruta en bucket "invoices"
      supplier_id = null,
      save = true,
      target_user_id,
    } = body ?? {};

    const userId: string = target_user_id || requesterId;

    // Authorize: requester acts on its own account OR consultant of target OR team member of business owned by target.
    if (userId !== requesterId) {
      const [{ data: consultantLink }, { data: teamLink }] = await Promise.all([
        admin
          .from("consultant_clients")
          .select("id")
          .eq("consultant_id", requesterId)
          .eq("client_user_id", userId)
          .eq("status", "active")
          .limit(1)
          .maybeSingle(),
        admin
          .from("restaurant_team_members")
          .select("id, restaurant_businesses!inner(owner_id)")
          .eq("user_id", requesterId)
          .eq("status", "active")
          .limit(1)
          .maybeSingle(),
      ]);
      const teamOwner = (teamLink as any)?.restaurant_businesses?.owner_id;
      if (!consultantLink && teamOwner !== userId) {
        return json({ error: "Forbidden: cannot operate on this account" }, 403);
      }
    }

    let imageDataUrl: string | null = null;
    let resolvedStoragePath: string | null = storage_path ?? null;
    let publicImageUrl: string | null = null;

    if (image_base64) {
      imageDataUrl = image_base64.startsWith("data:")
        ? image_base64
        : `data:${mime_type};base64,${image_base64}`;
    } else if (storage_path) {
      const { data: signed, error: sErr } = await admin.storage
        .from("invoices")
        .createSignedUrl(storage_path, 60 * 10);
      if (sErr || !signed) return json({ error: "No se pudo leer el archivo" }, 400);
      imageDataUrl = signed.signedUrl;
      publicImageUrl = signed.signedUrl;
    } else {
      return json({ error: "Envía image_base64 o storage_path" }, 400);
    }

    // Llamada multimodal al Lovable AI Gateway
    const aiRes = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_KEY}`,
        "Lovable-API-Key": LOVABLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Extrae la información estructurada de esta factura." },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (aiRes.status === 402) return json({ error: "Se requieren créditos de IA." }, 402);
    if (aiRes.status === 429) return json({ error: "Rate limit, intenta de nuevo." }, 429);
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("[invoice-ocr] gateway error", aiRes.status, t);
      return json({ error: `Error IA (${aiRes.status})` }, 502);
    }

    const aiJson = await aiRes.json();
    const raw = aiJson?.choices?.[0]?.message?.content ?? "";
    const parsed = safeParseJson<any>(raw) ?? {};

    let invoiceId: string | null = null;
    if (save) {
      const { data: ins, error: insErr } = await admin
        .from("supplier_invoices")
        .insert({
          user_id: userId,
          supplier_id,
          supplier_name: parsed.supplier_name ?? null,
          invoice_number: parsed.invoice_number ?? null,
          invoice_date: parsed.invoice_date ?? null,
          due_date: parsed.due_date ?? null,
          currency: parsed.currency ?? "COP",
          subtotal: parsed.subtotal ?? null,
          tax_amount: parsed.tax_amount ?? null,
          total_amount: parsed.total_amount ?? null,
          items: Array.isArray(parsed.items) ? parsed.items : [],
          raw_text: raw,
          image_url: publicImageUrl,
          storage_path: resolvedStoragePath,
          status: "pending",
          ai_confidence: typeof parsed.confidence === "number" ? parsed.confidence : null,
          ai_model: VISION_MODEL,
          notes: parsed.notes ?? null,
        })
        .select("id")
        .single();
      if (insErr) {
        console.error("[invoice-ocr] insert error", insErr);
        return json({ error: insErr.message }, 500);
      }
      invoiceId = ins!.id;
    }

    return json({ ok: true, invoice_id: invoiceId, extracted: parsed });
  } catch (e) {
    console.error("[invoice-ocr]", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
