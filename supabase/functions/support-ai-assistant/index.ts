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
      case "categorize_ticket":
        webQuery = "";
        rolePrompt = `Experto en servicio al cliente para restaurantes. Categoriza usando solo el contenido del ticket.
JSON: { ai_category, ai_priority_suggestion, summary, sentiment, requires_compensation }`;
        userPrompt = `Tipo: ${data.type}
Asunto: ${data.subject}
Descripción: ${data.description}
Cliente: ${data.customer_name || 'N/E'}`;
        break;

      case "generate_response":
        webQuery = `mejores prácticas respuesta queja cliente restaurante ${data.type || ''}`;
        rolePrompt = `Gerente de servicio al cliente. Genera respuesta empática (máx 200 palabras) basada en el caso. Mejores prácticas externas SOLO del CONTEXTO WEB.
JSON: { response_draft, suggested_actions, follow_up_needed, sources_used }`;
        userPrompt = `Tipo: ${data.type} | Prioridad: ${data.priority}
Asunto: ${data.subject}
Descripción: ${data.description}
Historial: ${data.messages?.map((m:any)=>`[${m.sender_type}]: ${m.message}`).join('\n') || 'Sin historial'}`;
        break;

      case "suggest_resolution":
        webQuery = `resolución conflicto cliente restaurante ${data.type || ''} compensación estándar industria`;
        rolePrompt = `Experto en resolución de conflictos. Sugiere resolución basada en el caso. Estándares de industria y casos similares SOLO con [Fuente N].
JSON: { recommended_resolution, compensation_suggestion, escalation_needed, prevention_tips, estimated_resolution_time, similar_cases (con [Fuente N] o "Información no disponible"), sources_used }`;
        userPrompt = `Tipo: ${data.type} | Prioridad: ${data.priority}
Descripción: ${data.description}
Estado: ${data.status} | Tiempo abierto: ${data.time_open || 'Reciente'}`;
        break;

      case "analyze_trends":
        webQuery = `benchmark servicio cliente restaurantes tiempo respuesta tasa resolución`;
        rolePrompt = `Analista de servicio al cliente. Detecta patrones en los datos provistos. Benchmarks de industria SOLO con [Fuente N].
JSON: { common_issues, peak_times, improvement_areas, positive_trends, recommendations, industry_comparison (con [Fuente N] o null), sources_used }`;
        userPrompt = `Total tickets: ${data.total_tickets}
Por tipo: ${JSON.stringify(data.by_type || {})}
Por prioridad: ${JSON.stringify(data.by_priority || {})}
Resolución: ${data.resolution_rate}% | Tiempo resp: ${data.avg_response_time}h`;
        break;

      default:
        throw new Error("Acción no válida");
    }

    const research = webQuery
      ? await webResearch(webQuery, { limit: 3, scrape: false, logPrefix: `[support-ai:${action}]` })
      : { enabled: false, provider: "none" as const, sources: [] };

    const systemPrompt = composeSystemPrompt({
      guardrails: { jsonOutput: true, requireConfidence: action !== "categorize_ticket", domain: "servicio al cliente en restaurantes" },
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
      logPrefix: `[support-ai-assistant:${action}]`,
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
    console.error("Error in support-ai-assistant:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
