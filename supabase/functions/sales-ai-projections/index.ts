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

    switch (action) {
      case "generate_projection":
        webQuery = `eventos clima ${data.location || ''} ${data.projection_date || ''} feriados`;
        rolePrompt = `Analista financiero de restaurantes. Genera proyección de ventas usando los datos históricos provistos como base matemática.
Factores externos (eventos, clima, feriados) SOLO si vienen del CONTEXTO WEB con [Fuente N]. Si web no aportó, basa la proyección únicamente en histórico y dilo.
JSON: { projected_revenue, confidence_level, factors (objeto), ai_reasoning, recommendations, sources_used }`;
        userPrompt = `Fecha objetivo: ${data.projection_date}
Histórico 30d: $${data.historical_revenue || 0} | Promedio diario: $${data.avg_daily_revenue || 0}
Día semana: ${data.day_of_week || 'N/E'} | Eventos especiales: ${data.special_events || 'Ninguno'}
Meta actual: $${data.current_goal || 0} | Ubicación: ${data.location || 'N/E'}`;
        break;

      case "analyze_goal_progress":
        webQuery = `estrategias aumentar ventas restaurantes 2026 mejores prácticas`;
        rolePrompt = `Coach de negocios para restaurantes. Calcula matemáticamente el progreso; recomendaciones genéricas valen, pero benchmarks o cifras de industria solo con [Fuente N].
JSON: { status, daily_target_needed, probability_of_success, action_items, motivation_message, sources_used }`;
        userPrompt = `Meta: $${data.revenue_goal} | Actual: $${data.current_revenue}
Días restantes: ${data.days_remaining} | Periodo: ${data.period_start} a ${data.period_end}
Progreso: ${data.progress_percent}%`;
        break;

      case "suggest_goals":
        webQuery = `benchmark ventas restaurantes ${data.restaurant_type || ''} ticket promedio 2026`;
        rolePrompt = `Estratega de restaurantes. Calcula metas usando el histórico provisto. Benchmarks de industria SOLO del CONTEXTO WEB con cita.
JSON: { suggested_revenue_goal, suggested_covers_goal, suggested_avg_ticket, rationale, stretch_goal, conservative_goal, industry_benchmark (con [Fuente N] o null), confidence, sources_used }`;
        userPrompt = `Periodo: ${data.period_type} (${data.period_start} a ${data.period_end})
Anterior — Ingresos: $${data.previous_revenue || 0} | Cubiertos: ${data.previous_covers || 0} | Ticket: $${data.previous_avg_ticket || 0}
Tendencia: ${data.trend || 'estable'} | Tipo: ${data.restaurant_type || 'N/E'}`;
        break;

      default:
        throw new Error("Acción no válida");
    }

    const research = await webResearch(webQuery, { limit: 4, scrape: false, logPrefix: `[sales-ai:${action}]` });

    const systemPrompt = composeSystemPrompt({
      guardrails: { jsonOutput: true, requireConfidence: true, domain: "proyecciones de venta para restaurantes" },
      rolePrompt,
      webContextBlock: formatSourcesForPrompt(research),
    });

    const aiResult = await callAIGateway({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tier: "fast",
      maxTokens: 1500,
      jsonMode: true,
      logPrefix: `[sales-ai-projections:${action}]`,
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
    console.error("Error in sales-ai-projections:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
