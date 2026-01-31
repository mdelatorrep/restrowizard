import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Helper function to call OpenAI with retry and backoff
async function callOpenAIWithRetry(
  messages: Array<{ role: string; content: string }>,
  apiKey: string,
  maxRetries: number = 3
): Promise<{ response: string } | { error: string; status: number }> {
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[copilot-chat] Calling OpenAI (attempt ${attempt}/${maxRetries})...`);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
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
        console.error(`[copilot-chat] OpenAI API error (attempt ${attempt}):`, response.status, errorText);
        
        if (response.status === 429) {
          if (attempt < maxRetries) {
            // Wait with exponential backoff before retry
            const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
            console.log(`[copilot-chat] Rate limited, waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          return { error: 'Límite de solicitudes excedido. Por favor espera unos segundos e intenta nuevamente.', status: 429 };
        }
        
        if (response.status === 402) {
          return { error: 'Se requiere pago. Agrega créditos a tu cuenta.', status: 402 };
        }
        
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || 'No pude generar una respuesta.';
      
      console.log('[copilot-chat] Completed successfully');
      return { response: aiResponse };
      
    } catch (error) {
      console.error(`[copilot-chat] Error on attempt ${attempt}:`, error);
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
  
  return { error: 'Error después de múltiples intentos.', status: 500 };
}

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

    const result = await callOpenAIWithRetry(messages, OPENAI_API_KEY);
    
    if ('error' in result) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: result.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ response: result.response }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[copilot-chat] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
