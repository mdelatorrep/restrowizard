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
    const { type, data } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `Eres un experto en sostenibilidad y ESG para restaurantes. Analiza los datos proporcionados y genera recomendaciones específicas para:
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
3. Acciones concretas recomendadas
4. Estimación de ahorro potencial`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const result = await response.json();
    const analysis = result.choices?.[0]?.message?.content || 'No se pudo generar el análisis.';

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
