import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  callAIGateway,
  gatewayErrorResponse,
  safeParseJson,
} from "../_shared/ai-gateway.ts";
import { composeSystemPrompt } from "../_shared/ai-guardrails.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { feedback, action } = await req.json();

    let systemPrompt = "";
    let userPrompt = "";
    let jsonMode = false;

    if (action === "analyze_sentiment") {
      jsonMode = true;
      systemPrompt =
        `Eres un experto en análisis de sentimiento para restaurantes. Analiza el feedback del cliente y devuelve un JSON con:
- sentiment_score: número entre -1 (muy negativo) y 1 (muy positivo)
- sentiment_label: "positive", "neutral", o "negative"
- key_topics: array de temas principales mencionados (máximo 5)
- ai_response_suggestion: una respuesta profesional sugerida para el cliente

Responde SOLO con el JSON, sin texto adicional.`;
      userPrompt = `Analiza este feedback de cliente:
Rating: ${feedback.rating || "No especificado"}
Comentario: ${feedback.comment || "Sin comentario"}
Calificación comida: ${feedback.food_rating || "N/A"}
Calificación servicio: ${feedback.service_rating || "N/A"}
Calificación ambiente: ${feedback.ambiance_rating || "N/A"}`;
    } else if (action === "generate_response") {
      systemPrompt =
        `Eres un gerente de restaurante profesional y empático. Genera una respuesta personalizada para el feedback del cliente.
La respuesta debe ser:
- Profesional y cálida
- Agradecer el feedback
- Abordar puntos específicos mencionados
- Si es negativo, ofrecer disculpas y solución
- Máximo 150 palabras`;
      userPrompt = `Genera una respuesta para este feedback:
Nombre del cliente: ${feedback.customer_name || "Cliente"}
Rating: ${feedback.rating}/5
Comentario: ${feedback.comment}`;
    } else {
      throw new Error("Acción no válida");
    }

    const result = await callAIGateway({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tier: "cheap",
      maxTokens: 500,
      jsonMode,
      logPrefix: "[feedback-ai-analysis]",
    });

    if (!result.ok) return gatewayErrorResponse(result, corsHeaders);

    let payload: unknown;
    if (action === "analyze_sentiment") {
      payload = safeParseJson(result.content) ?? {
        sentiment_score: 0,
        sentiment_label: "neutral",
        key_topics: [],
        ai_response_suggestion: result.content,
      };
    } else {
      payload = { response: result.content };
    }

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in feedback-ai-analysis:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message ?? "Error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
