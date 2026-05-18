import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAIGateway, gatewayErrorResponse } from "../_shared/ai-gateway.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data } = await req.json();

    const systemPrompt = `Eres un experto en sostenibilidad y ESG para restaurantes en Latinoamérica. 
Tienes acceso a búsqueda web para obtener información actualizada sobre:
- Regulaciones ambientales locales
- Precios de energías renovables
- Proveedores sostenibles
- Certificaciones ESG
- Mejores prácticas de la industria

Analiza los datos proporcionados y genera recomendaciones específicas para:
- Reducir huella de carbono
- Minimizar desperdicio alimenticio
- Optimizar uso de agua y energía
- Cumplir con estándares ESG
- Identificar proveedores más sostenibles

Responde en español con recomendaciones prácticas y accionables.`;

    const userPrompt = `Analiza estos datos de sostenibilidad del restaurante y proporciona un informe detallado con recomendaciones:

${JSON.stringify(data, null, 2)}

Incluye:
1. Resumen ejecutivo
2. Áreas de mejora prioritarias
3. Acciones concretas recomendadas con costos estimados actuales de mercado
4. Estimación de ahorro potencial
5. Normativas o certificaciones aplicables en la región`;

    const aiResult = await callAIGateway({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tier: "reasoning",
      maxTokens: 3000,
      logPrefix: "[sustainability-ai-analysis]",
    });
    if (!aiResult.ok) {
      return new Response(
        JSON.stringify({ error: aiResult.error, success: false }),
        { status: aiResult.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const analysis = aiResult.content || "No se pudo generar el análisis.";

    console.log('Sustainability analysis completed successfully');

    return new Response(JSON.stringify({ analysis, success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Sustainability analysis error:', error);
    return new Response(JSON.stringify({ error: error.message, success: false }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
