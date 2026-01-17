import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "generate_projection":
        systemPrompt = `Eres un analista financiero experto en restaurantes con acceso a búsqueda web para obtener información sobre eventos locales, clima, tendencias económicas y factores que afectan las ventas de restaurantes. Genera proyecciones de ventas basadas en datos históricos y factores externos actuales.
Responde en JSON con:
- projected_revenue: número estimado
- confidence_level: porcentaje de confianza (0-100)
- factors: objeto con factores considerados (incluye factores externos actuales)
- ai_reasoning: explicación del análisis incluyendo datos de búsqueda web
- recommendations: array de recomendaciones`;
        
        userPrompt = `Genera proyección de ventas para:
Fecha objetivo: ${data.projection_date}
Ventas históricas (últimos 30 días): $${data.historical_revenue || 0}
Promedio diario: $${data.avg_daily_revenue || 0}
Día de la semana: ${data.day_of_week || 'No especificado'}
Eventos especiales: ${data.special_events || 'Ninguno'}
Meta actual: $${data.current_goal || 0}
Ubicación: ${data.location || 'No especificada'}

Busca eventos locales, pronóstico del clima y otros factores que puedan afectar las ventas para esta fecha.`;
        break;

      case "analyze_goal_progress":
        systemPrompt = `Eres un coach de negocios para restaurantes con acceso a búsqueda web para mejores prácticas de la industria. Analiza el progreso hacia la meta y proporciona insights accionables.
Responde en JSON con:
- status: "on_track", "at_risk", "behind"
- daily_target_needed: número
- probability_of_success: porcentaje
- action_items: array de acciones específicas basadas en mejores prácticas actuales
- motivation_message: mensaje motivacional`;
        
        userPrompt = `Analiza el progreso de esta meta:
Meta de ingresos: $${data.revenue_goal}
Ingresos actuales: $${data.current_revenue}
Días restantes: ${data.days_remaining}
Periodo: ${data.period_start} a ${data.period_end}
Progreso actual: ${data.progress_percent}%

Busca estrategias probadas para restaurantes que necesitan acelerar ventas.`;
        break;

      case "suggest_goals":
        systemPrompt = `Eres un estratega de restaurantes con acceso a búsqueda web para benchmarks de la industria y tendencias de mercado. Sugiere metas realistas y alcanzables basadas en el historial y datos de mercado actuales.
Responde en JSON con:
- suggested_revenue_goal: número
- suggested_covers_goal: número
- suggested_avg_ticket: número
- rationale: explicación con datos de mercado
- stretch_goal: meta ambiciosa
- conservative_goal: meta conservadora
- industry_benchmark: benchmark de la industria para comparación`;
        
        userPrompt = `Sugiere metas para el próximo periodo:
Periodo: ${data.period_type} (${data.period_start} a ${data.period_end})
Ingresos del periodo anterior: $${data.previous_revenue || 0}
Cubiertos del periodo anterior: ${data.previous_covers || 0}
Ticket promedio anterior: $${data.previous_avg_ticket || 0}
Tendencia: ${data.trend || 'estable'}
Tipo de restaurante: ${data.restaurant_type || 'No especificado'}

Busca benchmarks actuales de la industria para restaurantes similares.`;
        break;

      default:
        throw new Error("Acción no válida");
    }

    console.log(`Calling OpenAI GPT-5-mini with web search for sales projections: ${action}`);

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

    console.log(`Sales AI projections completed: ${action}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in sales-ai-projections:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
