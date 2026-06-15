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
      case "analyze_mention":
        webQuery = `tendencias virales ${data.platform || ''} restaurantes ${(data.content || '').slice(0,80)}`;
        rolePrompt = `Experto en social listening. Analiza la mención provista. Contexto de tendencias virales SOLO si está en el CONTEXTO WEB con [Fuente N].
JSON: { sentiment_score, sentiment_label, key_topics, urgency, requires_response, suggested_response, trending_context (con [Fuente N] o null), sources_used }`;
        userPrompt = `Plataforma: ${data.platform}
Autor: ${data.author_name || 'Anónimo'}
Contenido: ${data.content}
Rating: ${data.rating || 'N/A'} | Engagement: ${data.engagement_likes || 0} likes, ${data.engagement_comments || 0} comentarios`;
        break;

      case "generate_response":
        webQuery = `mejores prácticas community management ${data.platform || ''} restaurantes`;
        rolePrompt = `Community manager profesional. Adapta el tono a ${data.platform}. Mejores prácticas SOLO con [Fuente N].`;
        userPrompt = `Plataforma: ${data.platform}
Mención: ${data.content}
Sentimiento: ${data.sentiment_label}
Autor: ${data.author_name || 'Usuario'}`;
        break;

      case "generate_report":
        webQuery = `benchmark reputación online restaurantes ${data.restaurant_type || ''} sentiment industria`;
        rolePrompt = `Analista de reputación online. Reporte ejecutivo basado en los datos. Comparación con benchmarks SOLO con [Fuente N].
JSON: { summary, avg_sentiment, trending_topics, strengths, areas_to_improve, competitor_comparison (con [Fuente N] o null), recommendations, sources_used }`;
        userPrompt = `Total: ${data.total_mentions} | Pos: ${data.positive_count} | Neg: ${data.negative_count} | Neu: ${data.neutral_count}
Plataformas: ${data.platforms?.join(', ') || 'Varias'}
Temas: ${data.topics?.join(', ') || 'N/E'}
Tipo: ${data.restaurant_type || 'N/E'}`;
        break;

      case "detect_crisis":
        webQuery = `crisis reputación restaurantes ${new Date().getFullYear()} manejo casos`;
        rolePrompt = `Experto en gestión de crisis. Evalúa con las señales provistas. Casos similares SOLO con [Fuente N].
JSON: { crisis_level, indicators, affected_areas, immediate_actions, communication_strategy, monitoring_priority, similar_cases (con [Fuente N] o "Información no disponible"), sources_used }`;
        userPrompt = `Menciones neg recientes: ${data.recent_negative_count}
Temas problemáticos: ${data.problem_topics?.join(', ') || 'Ninguno'}
Velocidad: ${data.mention_velocity || 'normal'} | Alto impacto: ${data.high_impact_mentions || 0}`;
        break;

      default:
        throw new Error("Acción no válida");
    }

    const research = await webResearch(webQuery, { limit: 3, scrape: false, logPrefix: `[social-ai:${action}]` });
    const jsonMode = action !== "generate_response";

    const systemPrompt = composeSystemPrompt({
      guardrails: { jsonOutput: jsonMode, requireConfidence: jsonMode, domain: "social listening de restaurantes" },
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
      jsonMode,
      logPrefix: `[social-ai-analysis:${action}]`,
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
    console.error("Error in social-ai-analysis:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
