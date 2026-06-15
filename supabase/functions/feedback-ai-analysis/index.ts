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

    let rolePrompt = "";
    let userPrompt = "";
    let jsonMode = false;

    if (action === "analyze_sentiment") {
      jsonMode = true;
      rolePrompt =
        `Analiza el feedback del cliente y devuelve JSON con:
- sentiment_score: número entre -1 y 1
- sentiment_label: "positive" | "neutral" | "negative"
- key_topics: array (máx 5) extraídos LITERALMENTE del comentario
- ai_response_suggestion: respuesta profesional basada solo en lo dicho por el cliente

No inventes detalles que el cliente no mencionó (platos, nombres, fechas).`;
      userPrompt = `Rating: ${feedback.rating || "No especificado"}
Comentario: ${feedback.comment || "Sin comentario"}
Comida: ${feedback.food_rating || "N/A"} | Servicio: ${feedback.service_rating || "N/A"} | Ambiente: ${feedback.ambiance_rating || "N/A"}`;
    } else if (action === "generate_response") {
      rolePrompt =
        `Gerente de restaurante profesional y empático. Responde al feedback en máx 150 palabras:
- Agradece y aborda SOLO los puntos que el cliente mencionó
- Si es negativo: disculpa sincera + solución concreta
- No prometas compensaciones específicas ni inventes nombres/cargos
- Tono cálido pero profesional`;
      userPrompt = `Cliente: ${feedback.customer_name || "Cliente"}
Rating: ${feedback.rating}/5
Comentario: ${feedback.comment}`;
    } else {
      throw new Error("Acción no válida");
    }

    const systemPrompt = composeSystemPrompt({
      guardrails: { jsonOutput: jsonMode, domain: "análisis de feedback de restaurantes" },
      rolePrompt,
    });

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
