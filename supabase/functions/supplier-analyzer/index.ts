import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SupplierRequest {
  itemName: string;
  currentCost: number;
  currentSupplier?: string;
  unit: string;
  city: string;
  country?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const { itemName, currentCost, currentSupplier, unit, city, country = 'México' }: SupplierRequest = await req.json();

    if (!itemName || !city) {
      return new Response(
        JSON.stringify({ error: 'itemName and city are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing suppliers for: ${itemName} in ${city}, ${country}`);

    // Build the search prompt for OpenAI Responses API with web search
    const systemPrompt = `Eres un experto en la industria de restaurantes y cadena de suministro de alimentos en ${country}. 
Tu objetivo es encontrar proveedores alternativos reales para ingredientes de restaurantes.

IMPORTANTE:
- Busca proveedores REALES con información de contacto verificable
- Enfócate en: centrales de abastos, mercados mayoristas, distribuidores locales, productores directos
- Incluye precios estimados cuando sea posible
- Proporciona información de contacto real (teléfono, dirección, horarios)
- Si no encuentras información específica, indica claramente que es estimado

Responde SIEMPRE en formato JSON válido.`;

    const userPrompt = `Busca proveedores alternativos para "${itemName}" en ${city}, ${country}.

Información actual:
- Costo actual: $${currentCost} por ${unit}
${currentSupplier ? `- Proveedor actual: ${currentSupplier}` : ''}

Busca en:
1. Central de Abastos de ${city} o cercana
2. Mercados mayoristas locales
3. Distribuidores de alimentos para restaurantes
4. Productores o agricultores locales (si aplica)

Responde con este formato JSON exacto:
{
  "suppliers": [
    {
      "name": "Nombre del proveedor o puesto",
      "type": "central_abastos|mayorista|distribuidor|productor",
      "estimated_price": 0.00,
      "unit": "${unit}",
      "savings_percent": 0,
      "contact": {
        "phone": "número si está disponible",
        "address": "dirección completa",
        "hours": "horario de atención",
        "email": "email si está disponible"
      },
      "source": "fuente de la información",
      "confidence": "high|medium|low",
      "notes": "notas adicionales"
    }
  ],
  "market_insights": "Análisis del mercado local para este producto",
  "recommendations": ["recomendación 1", "recomendación 2"],
  "average_market_price": 0.00,
  "best_season": "mejor temporada para comprar si aplica"
}`;

    // Call OpenAI Responses API with web search tool
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        input: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            type: 'web_search_preview',
            search_context_size: 'high'
          }
        ],
        text: {
          format: {
            type: 'json_object'
          }
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    // Extract the text content from the response
    let analysisResult;
    
    // The Responses API returns output array with different item types
    const outputItems = data.output || [];
    let textContent = '';
    
    for (const item of outputItems) {
      if (item.type === 'message' && item.content) {
        for (const content of item.content) {
          if (content.type === 'output_text') {
            textContent = content.text;
            break;
          }
        }
      }
    }

    if (!textContent) {
      // Fallback: try to find text in different structure
      if (data.output_text) {
        textContent = data.output_text;
      } else if (typeof data.output === 'string') {
        textContent = data.output;
      }
    }

    try {
      analysisResult = JSON.parse(textContent);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', textContent);
      // Create a structured response from the text
      analysisResult = {
        suppliers: [],
        market_insights: textContent || 'No se encontró información específica para este producto en esta ubicación.',
        recommendations: ['Consultar directamente en la central de abastos local', 'Contactar a distribuidores de alimentos de la zona'],
        average_market_price: null,
        best_season: null
      };
    }

    // Calculate potential savings
    const potentialSavings = analysisResult.suppliers?.reduce((maxSaving: number, supplier: any) => {
      const saving = supplier.savings_percent || 0;
      return Math.max(maxSaving, saving);
    }, 0) || 0;

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          ...analysisResult,
          potential_savings: potentialSavings,
          analyzed_at: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Supplier analyzer error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});