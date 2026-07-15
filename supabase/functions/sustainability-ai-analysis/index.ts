import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireUser } from "../_shared/require-auth.ts";
import { callAIGateway, gatewayErrorResponse } from "../_shared/ai-gateway.ts";
import { webResearch, formatSourcesForPrompt } from "../_shared/web-research.ts";
import { composeSystemPrompt, checkIntegrity } from "../_shared/ai-guardrails.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {


    const auth = await requireUser(req);

    if (auth instanceof Response) return auth;
    const { type, data } = await req.json();

    const country = data?.country || data?.location?.country || 'Latinoamérica';
    const city = data?.city || data?.location?.city || '';

    const research = await webResearch(
      `regulaciones ESG sostenibilidad restaurantes ${city} ${country} certificaciones energía renovable`,
      { limit: 5, scrape: true, country: typeof country === "string" ? country.slice(0,2).toLowerCase() : undefined, logPrefix: "[sustainability]" },
    );

    const rolePrompt = `Eres un experto en sostenibilidad y ESG para restaurantes en ${country}.
Analiza los datos del restaurante y genera un informe accionable cubriendo:
- Huella de carbono y energía
- Gestión de desperdicio alimenticio
- Uso de agua y energía
- Cumplimiento ESG y certificaciones aplicables
- Proveedores sostenibles

Regulaciones, certificaciones específicas, precios actuales y nombres de proveedores SOLO si vienen del CONTEXTO WEB. Cita [Fuente N].`;

    const systemPrompt = composeSystemPrompt({
      guardrails: { domain: "sostenibilidad ESG en restaurantes", requireConfidence: true },
      rolePrompt,
      webContextBlock: formatSourcesForPrompt(research),
    });

    const userPrompt = `Datos del restaurante (${type || 'análisis general'}):

${JSON.stringify(data, null, 2)}

Entrega un informe en español con:
1. Resumen ejecutivo
2. Áreas de mejora prioritarias
3. Acciones concretas (con costos solo si hay fuente)
4. Ahorro estimado (marca como 'Estimación:' y justifica)
5. Normativas / certificaciones aplicables (solo con [Fuente N])
6. Al final: bloque "Confianza: X/100" y "Fuentes usadas: [urls]"`;

    const aiResult = await callAIGateway({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tier: "reasoning",
      maxTokens: 3000,
      logPrefix: "[sustainability-ai-analysis]",
    });
    if (!aiResult.ok) {
      return new Response(
        JSON.stringify({ error: aiResult.error, success: false }),
        { status: aiResult.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const analysis = aiResult.content || "No se pudo generar el análisis.";
    const integrity = checkIntegrity(analysis, research.enabled);

    return new Response(
      JSON.stringify({
        analysis,
        success: true,
        meta: {
          web_research: { enabled: research.enabled, provider: research.provider, sources_count: research.sources.length },
          integrity,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Sustainability analysis error:', error);
    return new Response(JSON.stringify({ error: error.message, success: false }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
