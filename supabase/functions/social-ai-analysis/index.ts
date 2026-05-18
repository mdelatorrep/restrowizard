import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAIGateway, gatewayErrorResponse, safeParseJson } from "../_shared/ai-gateway.ts";

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

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "analyze_mention":
        systemPrompt = `Eres un experto en social listening para restaurantes con acceso a búsqueda web para contexto adicional sobre tendencias y temas virales actuales. Analiza la mención y determina:
Responde en JSON con:
- sentiment_score: número entre -1 y 1
- sentiment_label: "positive", "neutral", "negative"
- key_topics: array de temas principales
- urgency: "low", "medium", "high"
- requires_response: boolean
- suggested_response: respuesta sugerida si aplica
- trending_context: contexto de tendencias actuales si es relevante`;
        
        userPrompt = `Analiza esta mención:
Plataforma: ${data.platform}
Autor: ${data.author_name || 'Anónimo'}
Contenido: ${data.content}
Rating: ${data.rating || 'N/A'}
Engagement: ${data.engagement_likes || 0} likes, ${data.engagement_comments || 0} comentarios

Busca si hay contexto adicional sobre tendencias virales o temas actuales relacionados.`;
        break;

      case "generate_response":
        systemPrompt = `Eres un community manager profesional para restaurantes con acceso a búsqueda web para mejores prácticas de respuesta en redes sociales. Genera una respuesta apropiada para la plataforma que:
- Sea adecuada al tono de la plataforma
- Siga mejores prácticas actuales de community management
- Sea breve y profesional
- Invite a continuar la conversación si es apropiado
- Agradezca el feedback

Adapta el tono: más informal para Instagram/TikTok, más profesional para Google/TripAdvisor.`;
        
        userPrompt = `Genera respuesta para:
Plataforma: ${data.platform}
Mención: ${data.content}
Sentimiento: ${data.sentiment_label}
Autor: ${data.author_name || 'Usuario'}

Busca mejores prácticas actuales de respuesta en ${data.platform} para restaurantes.`;
        break;

      case "generate_report":
        systemPrompt = `Eres un analista de reputación online con acceso a búsqueda web para benchmarks de la industria. Genera un reporte ejecutivo de sentimiento.
Responde en JSON con:
- summary: resumen ejecutivo (2-3 oraciones)
- avg_sentiment: sentimiento promedio
- trending_topics: temas más mencionados
- strengths: aspectos positivos destacados
- areas_to_improve: áreas de mejora
- competitor_comparison: comparación con benchmarks de la industria
- recommendations: acciones recomendadas basadas en mejores prácticas`;
        
        userPrompt = `Genera reporte para el periodo:
Total menciones: ${data.total_mentions}
Positivas: ${data.positive_count}
Negativas: ${data.negative_count}
Neutrales: ${data.neutral_count}
Plataformas: ${data.platforms?.join(', ') || 'Varias'}
Temas frecuentes: ${data.topics?.join(', ') || 'No especificados'}
Tipo de restaurante: ${data.restaurant_type || 'No especificado'}

Busca benchmarks de reputación online para restaurantes similares.`;
        break;

      case "detect_crisis":
        systemPrompt = `Eres un experto en gestión de crisis de reputación con acceso a búsqueda web para detectar si hay crisis similares o tendencias negativas en la industria. Evalúa si hay una crisis potencial.
Responde en JSON con:
- crisis_level: "none", "low", "medium", "high", "critical"
- indicators: señales de alerta detectadas
- affected_areas: áreas afectadas
- immediate_actions: acciones inmediatas recomendadas basadas en casos de éxito
- communication_strategy: estrategia de comunicación
- monitoring_priority: qué monitorear de cerca
- similar_cases: casos similares en la industria y cómo se manejaron`;
        
        userPrompt = `Evalúa posible crisis:
Menciones negativas recientes: ${data.recent_negative_count}
Temas problemáticos: ${data.problem_topics?.join(', ') || 'Ninguno'}
Velocidad de menciones: ${data.mention_velocity || 'normal'}
Menciones de alto impacto: ${data.high_impact_mentions || 0}

Busca si hay crisis similares o tendencias negativas en restaurantes actualmente.`;
        break;

      default:
        throw new Error("Acción no válida");
    }

    console.log(`Calling OpenAI GPT-5-mini with web search for social analysis: ${action}`);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1500,
        tools: [{ type: 'web_search_preview' }],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Se requiere pago." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      result = { response: content };
    }

    console.log(`Social AI analysis completed: ${action}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in social-ai-analysis:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
