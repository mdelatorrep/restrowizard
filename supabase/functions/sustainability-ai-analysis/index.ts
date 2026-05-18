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

    console.log('Calling OpenAI GPT-5 with web search for sustainability analysis...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 3000,
        tools: [{ type: 'web_search_preview' }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Límite de solicitudes excedido. Intenta más tarde.', success: false }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Se requiere pago. Agrega créditos a tu cuenta.', success: false }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    const analysis = result.choices?.[0]?.message?.content || 'No se pudo generar el análisis.';

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
