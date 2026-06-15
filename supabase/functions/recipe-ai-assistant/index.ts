import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { action, data } = await req.json();

    let rolePrompt = "";
    let userPrompt = "";
    let webQuery = "";
    let jsonMode = true;

    switch (action) {
      case "calculate_cost":
        webQuery = `precios mayoristas ingredientes ${data.ingredients?.slice(0,3).map((i:any)=>i.ingredient_name).join(', ') || ''} ${data.country || ''}`;
        rolePrompt = `Eres experto en costeo de recetas. Calcula con los costos DADOS por el usuario; los precios de mercado externos solo si vienen del CONTEXTO WEB con cita.
Responde JSON: { total_cost, cost_per_portion, suggested_price, profit_margin_percent, market_comparison (con [Fuente N] o "no verificado"), analysis, confidence, sources_used }`;
        userPrompt = `Receta: ${data.recipe_name}
Porciones: ${data.portions || 1}
Ingredientes:
${data.ingredients?.map((i:any)=>`- ${i.ingredient_name}: ${i.quantity} ${i.unit} @ $${i.unit_cost || 0}`).join('\n') || 'Sin ingredientes'}`;
        break;

      case "suggest_improvements":
        webQuery = `tendencias culinarias 2026 ${data.category || ''} técnicas modernas restaurantes`;
        rolePrompt = `Eres chef consultor. Sugiere mejoras sustentadas en los datos de la receta. Tendencias externas SOLO si vienen del CONTEXTO WEB.
JSON: { cost_suggestions, presentation_tips, ingredient_alternatives, technique_improvements, trend_recommendations (cita [Fuente N] o omite), confidence, sources_used }`;
        userPrompt = `Receta: ${data.recipe_name}
Categoría: ${data.category}
Descripción: ${data.description}
Prep: ${data.prep_time_minutes} min
Ingredientes: ${data.ingredients?.map((i:any)=>i.ingredient_name).join(', ') || 'N/E'}
Instrucciones: ${data.instructions || 'N/E'}`;
        break;

      case "generate_description":
        jsonMode = false;
        webQuery = "";
        rolePrompt = `Eres copywriter gastronómico. Genera una descripción de menú apetitosa (máx 50 palabras) basada SOLO en los ingredientes y categoría dados. No inventes origen, premios ni certificaciones.`;
        userPrompt = `Receta: ${data.recipe_name}
Ingredientes principales: ${data.ingredients?.slice(0,5).map((i:any)=>i.ingredient_name).join(', ') || 'N/E'}
Categoría: ${data.category}`;
        break;

      case "scale_recipe":
        webQuery = "";
        rolePrompt = `Eres chef experto en escalado. Calcula matemáticamente la nueva cantidad para cada ingrediente.
JSON: { scaled_ingredients: [{ ingredient_name, original_quantity, scaled_quantity, unit }], notes }`;
        userPrompt = `Escala de ${data.original_portions} a ${data.new_portions} porciones:
${data.ingredients?.map((i:any)=>`- ${i.ingredient_name}: ${i.quantity} ${i.unit}`).join('\n') || 'Sin ingredientes'}`;
        break;

      default:
        throw new Error("Acción no válida");
    }

    const research = webQuery
      ? await webResearch(webQuery, { limit: 3, scrape: false, logPrefix: `[recipe-ai:${action}]` })
      : { enabled: false, provider: "none" as const, sources: [] };

    const systemPrompt = composeSystemPrompt({
      guardrails: { jsonOutput: jsonMode, domain: "costeo y desarrollo de recetas", requireConfidence: jsonMode },
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
      jsonMode,
      logPrefix: `[recipe-ai-assistant:${action}]`,
    });
    if (!aiResult.ok) return gatewayErrorResponse(aiResult, corsHeaders);
    const result = jsonMode
      ? (safeParseJson(aiResult.content) ?? { response: aiResult.content })
      : { response: aiResult.content };

    const integrity = checkIntegrity(aiResult.content, research.enabled);

    return new Response(JSON.stringify({
      ...result,
      meta: {
        web_research: { enabled: research.enabled, provider: research.provider, sources_count: research.sources.length },
        integrity,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error in recipe-ai-assistant:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
