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
    const { message, history } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const systemPrompt = `Eres el Co-Piloto de RestroWizard, un asistente IA especializado en gestión de restaurantes.
Tu rol es ayudar a gerentes y dueños de restaurantes con:
- Análisis de ventas y finanzas
- Gestión de inventario y proveedores
- Optimización de personal y turnos
- Insights de clientes y marketing
- Métricas operativas y KPIs
- Sostenibilidad y ESG

Responde siempre en español, de forma concisa y práctica. Usa datos cuando estén disponibles.
Tienes acceso a búsqueda web para obtener información actualizada sobre tendencias de la industria, precios de mercado, regulaciones y mejores prácticas.
Si no tienes datos específicos, ofrece recomendaciones generales basadas en mejores prácticas de la industria.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message }
    ];

    console.log('Calling OpenAI GPT-5-mini with web search for copilot chat...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages,
        max_tokens: 1500,
        tools: [{ type: 'web_search_preview' }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Límite de solicitudes excedido. Intenta más tarde.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Se requiere pago. Agrega créditos a tu cuenta.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'No pude generar una respuesta.';

    console.log('Copilot chat completed successfully');

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Copilot chat error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
