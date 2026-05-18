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

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "categorize_ticket":
        systemPrompt = `Eres un experto en servicio al cliente para restaurantes. Categoriza el ticket PQRS y sugiere prioridad.
Responde en JSON con:
- ai_category: "peticion", "queja", "reclamo", "sugerencia", "felicitacion"
- ai_priority_suggestion: "low", "medium", "high", "urgent"
- summary: resumen de 1 línea
- sentiment: "positive", "neutral", "negative"
- requires_compensation: boolean`;
        
        userPrompt = `Categoriza este ticket:
Tipo reportado: ${data.type}
Asunto: ${data.subject}
Descripción: ${data.description}
Cliente: ${data.customer_name || 'No especificado'}`;
        break;

      case "generate_response":
        systemPrompt = `Eres un gerente de servicio al cliente profesional y empático con acceso a búsqueda web para mejores prácticas de resolución de conflictos en restaurantes. Genera una respuesta para el ticket que:
- Sea profesional y empática
- Aborde el problema específico
- Ofrezca una solución cuando sea posible
- Si es queja/reclamo, incluya disculpa sincera
- Máximo 200 palabras

Responde en JSON con: response_draft, suggested_actions (array), follow_up_needed (boolean)`;
        
        userPrompt = `Genera respuesta para:
Tipo: ${data.type}
Prioridad: ${data.priority}
Asunto: ${data.subject}
Descripción: ${data.description}
Historial de mensajes: ${data.messages?.map((m: any) => `[${m.sender_type}]: ${m.message}`).join('\n') || 'Sin historial'}

Busca mejores prácticas de respuesta para este tipo de caso en restaurantes.`;
        break;

      case "suggest_resolution":
        systemPrompt = `Eres un experto en resolución de conflictos en restaurantes con acceso a búsqueda web para casos de estudio y mejores prácticas de la industria. Sugiere la mejor forma de resolver el caso.
Responde en JSON con:
- recommended_resolution: descripción de la resolución basada en mejores prácticas
- compensation_suggestion: si aplica compensación, qué tipo (basado en estándares de la industria)
- escalation_needed: boolean
- prevention_tips: cómo evitar casos similares
- estimated_resolution_time: tiempo estimado
- similar_cases: cómo se resolvieron casos similares`;
        
        userPrompt = `Sugiere resolución para:
Tipo: ${data.type}
Prioridad: ${data.priority}
Descripción: ${data.description}
Estado actual: ${data.status}
Tiempo abierto: ${data.time_open || 'Reciente'}

Busca mejores prácticas y casos de estudio para resolver este tipo de situación.`;
        break;

      case "analyze_trends":
        systemPrompt = `Eres un analista de servicio al cliente con acceso a búsqueda web para benchmarks de la industria. Analiza los tickets y detecta patrones.
Responde en JSON con:
- common_issues: array de problemas frecuentes
- peak_times: cuándo ocurren más tickets
- improvement_areas: áreas a mejorar
- positive_trends: aspectos positivos
- recommendations: acciones recomendadas basadas en mejores prácticas de la industria
- industry_comparison: comparación con benchmarks de la industria`;
        
        userPrompt = `Analiza estos tickets:
Total tickets: ${data.total_tickets}
Por tipo: ${JSON.stringify(data.by_type || {})}
Por prioridad: ${JSON.stringify(data.by_priority || {})}
Tasa de resolución: ${data.resolution_rate}%
Tiempo promedio de respuesta: ${data.avg_response_time} horas

Busca benchmarks de servicio al cliente para restaurantes y compara.`;
        break;

      default:
        throw new Error("Acción no válida");
    }

    console.log(`Calling OpenAI GPT-5-mini with web search for support assistant: ${action}`);

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

    console.log(`Support AI assistant completed: ${action}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in support-ai-assistant:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
