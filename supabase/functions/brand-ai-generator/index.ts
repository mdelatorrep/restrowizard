import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireUser } from "../_shared/require-auth.ts";
import { callAIGateway, gatewayErrorResponse, safeParseJson } from "../_shared/ai-gateway.ts";
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
    const { action, data } = await req.json();

    let rolePrompt = "";
    let userPrompt = "";
    let webQuery = "";

    switch (action) {
      case "generate_palette":
        webQuery = `tendencias paleta colores branding restaurantes ${data.cuisine_type || ''} 2026`;
        rolePrompt = `Diseñador de marca para restaurantes. Genera una paleta de colores HEX coherente con el brief.
JSON: { primary_color, secondary_color, accent_color, background_color, text_color, rationale, mood (array), sources_used }`;
        userPrompt = `Restaurante: ${data.brand_name}
Cocina: ${data.cuisine_type || 'N/E'}
Mood deseado: ${data.desired_mood || 'Profesional y acogedor'}
Público: ${data.target_audience || 'General'}`;
        break;

      case "suggest_typography":
        webQuery = `tipografías Google Fonts branding gastronómico ${data.brand_style || ''} 2026`;
        rolePrompt = `Tipógrafo en branding gastronómico. Sugiere fuentes REALES disponibles en Google Fonts.
JSON: { font_primary, font_secondary, font_accent, pairing_rationale, usage_guidelines, sources_used }`;
        userPrompt = `Restaurante: ${data.brand_name}
Estilo: ${data.brand_style || 'Moderno'}
Cocina: ${data.cuisine_type || 'N/E'}`;
        break;

      case "generate_tagline":
        webQuery = `taglines exitosos restaurantes ${data.cuisine_type || ''} eslogan`;
        rolePrompt = `Copywriter gastronómico. Genera 5 taglines originales basados en el brief. No copies marcas existentes.
JSON: { taglines: [5 strings], recommended, rationale, sources_used }`;
        userPrompt = `Nombre: ${data.brand_name}
Cocina: ${data.cuisine_type || 'N/E'}
Valores: ${data.brand_values || 'Calidad, sabor, servicio'}
Diferenciador: ${data.differentiator || 'N/E'}`;
        break;

      case "generate_brand_manual":
        webQuery = "";
        rolePrompt = `Consultor de branding. Genera un manual de marca resumido coherente con el brief provisto. No inventes historia ni premios.
JSON: { brand_essence, mission, vision, values, brand_personality, tone_of_voice, do_and_dont, application_guidelines }`;
        userPrompt = `Nombre: ${data.brand_name}
Tagline: ${data.tagline || 'No definido'}
Colores: ${data.primary_color}, ${data.secondary_color}
Tipografías: ${data.font_primary}, ${data.font_secondary}
Cocina: ${data.cuisine_type || 'N/E'}
Voz: ${data.brand_voice || 'No definida'}`;
        break;

      default:
        throw new Error("Acción no válida");
    }

    const research = webQuery
      ? await webResearch(webQuery, { limit: 3, scrape: false, logPrefix: `[brand-ai:${action}]` })
      : { enabled: false, provider: "none" as const, sources: [] };

    const systemPrompt = composeSystemPrompt({
      guardrails: { jsonOutput: true, domain: "branding gastronómico" },
      rolePrompt,
      webContextBlock: webQuery ? formatSourcesForPrompt(research) : undefined,
    });

    const aiResult = await callAIGateway({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tier: "fast",
      maxTokens: 1500,
      jsonMode: true,
      logPrefix: `[brand-ai-generator:${action}]`,
    });
    if (!aiResult.ok) return gatewayErrorResponse(aiResult, corsHeaders);
    const result = safeParseJson(aiResult.content) ?? { response: aiResult.content };
    const integrity = checkIntegrity(aiResult.content, research.enabled);

    return new Response(JSON.stringify({
      ...result,
      meta: {
        web_research: { enabled: research.enabled, provider: research.provider, sources_count: research.sources.length },
        integrity,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error in brand-ai-generator:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
