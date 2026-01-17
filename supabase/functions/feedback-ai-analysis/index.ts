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
    const { feedback, action } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "analyze_sentiment") {
      systemPrompt = `Eres un experto en análisis de sentimiento para restaurantes. Analiza el feedback del cliente y devuelve un JSON con:
- sentiment_score: número entre -1 (muy negativo) y 1 (muy positivo)
- sentiment_label: "positive", "neutral", o "negative"
- key_topics: array de temas principales mencionados (máximo 5)
- ai_response_suggestion: una respuesta profesional sugerida para el cliente

Responde SOLO con el JSON, sin texto adicional.`;
      
      userPrompt = `Analiza este feedback de cliente:
Rating: ${feedback.rating || 'No especificado'}
Comentario: ${feedback.comment || 'Sin comentario'}
Calificación comida: ${feedback.food_rating || 'N/A'}
Calificación servicio: ${feedback.service_rating || 'N/A'}
Calificación ambiente: ${feedback.ambiance_rating || 'N/A'}`;
    } else if (action === "generate_response") {
      systemPrompt = `Eres un gerente de restaurante profesional y empático. Genera una respuesta personalizada para el feedback del cliente. 
La respuesta debe ser:
- Profesional y cálida
- Agradecer el feedback
- Abordar puntos específicos mencionados
- Si es negativo, ofrecer disculpas y solución
- Máximo 150 palabras`;
      
      userPrompt = `Genera una respuesta para este feedback:
Nombre del cliente: ${feedback.customer_name || 'Cliente'}
Rating: ${feedback.rating}/5
Comentario: ${feedback.comment}`;
    } else {
      throw new Error("Acción no válida");
    }

    console.log(`Calling OpenAI GPT-5-nano for feedback analysis: ${action}`);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-nano",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 500,
        tools: [{ type: 'web_search_preview' }],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido. Intenta más tarde." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Se requiere pago. Agrega créditos a tu cuenta." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let result;
    if (action === "analyze_sentiment") {
      try {
        result = JSON.parse(content);
      } catch {
        result = { 
          sentiment_score: 0, 
          sentiment_label: "neutral", 
          key_topics: [],
          ai_response_suggestion: content 
        };
      }
    } else {
      result = { response: content };
    }

    console.log(`Feedback AI analysis completed: ${action}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in feedback-ai-analysis:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
