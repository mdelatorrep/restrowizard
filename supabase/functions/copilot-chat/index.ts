import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "npm:ai";
import { pickSdkModel } from "../_shared/ai-sdk-gateway.ts";

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
Si no tienes datos específicos, ofrece recomendaciones generales basadas en mejores prácticas de la industria.
Usa markdown ligero (negritas, listas) cuando ayude a la lectura.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const messages = body?.messages as UIMessage[] | undefined;

    if (!Array.isArray(messages)) {
      return new Response(
        JSON.stringify({
          error:
            "Payload inválido. Se esperaba { messages: UIMessage[] } (formato AI SDK).",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const result = streamText({
      model: pickSdkModel("fast"),
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      abortSignal: req.signal,
    });

    return result.toUIMessageStreamResponse({ headers: corsHeaders });
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
