import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAIGateway, gatewayErrorResponse } from "../_shared/ai-gateway.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres el Co-Piloto de RestroWizard, un asistente IA especializado en gestión de restaurantes.
Tu rol es ayudar a gerentes y dueños de restaurantes con:
- Análisis de ventas y finanzas
- Gestión de inventario y proveedores
- Optimización de personal y turnos
- Insights de clientes y marketing
- Métricas operativas y KPIs
- Sostenibilidad y ESG

Responde siempre en español, de forma concisa y práctica. Usa datos cuando estén disponibles.
Si no tienes datos específicos, ofrece recomendaciones generales basadas en mejores prácticas de la industria.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, history } = await req.json();

    const messages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...(Array.isArray(history) ? history : []),
      { role: "user" as const, content: message },
    ];

    const result = await callAIGateway({
      messages,
      tier: "fast",
      maxTokens: 1500,
      logPrefix: "[copilot-chat]",
    });

    if (!result.ok) return gatewayErrorResponse(result, corsHeaders);

    return new Response(JSON.stringify({ response: result.content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[copilot-chat] Error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message ?? "Error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
