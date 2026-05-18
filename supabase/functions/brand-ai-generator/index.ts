import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAIGateway, gatewayErrorResponse, safeParseJson } from "../_shared/ai-gateway.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "generate_palette":
        systemPrompt = `Eres un diseñador de marca experto en restaurantes con acceso a búsqueda web para tendencias actuales de diseño y branding gastronómico. Genera una paleta de colores profesional basada en tendencias actuales.
Responde en JSON con:
- primary_color: color principal en HEX
- secondary_color: color secundario en HEX
- accent_color: color de acento en HEX
- background_color: color de fondo sugerido en HEX
- text_color: color de texto sugerido en HEX
- rationale: explicación de por qué estos colores funcionan y qué tendencias siguen
- mood: palabras que describen el mood (array)`;
        
        userPrompt = `Genera paleta de colores para:
Nombre del restaurante: ${data.brand_name}
Tipo de cocina: ${data.cuisine_type || 'No especificado'}
Ambiente deseado: ${data.desired_mood || 'Profesional y acogedor'}
Público objetivo: ${data.target_audience || 'General'}

Busca tendencias actuales de diseño para restaurantes de este tipo.`;
        break;

      case "suggest_typography":
        systemPrompt = `Eres un tipógrafo experto en branding gastronómico con acceso a búsqueda web para tendencias tipográficas actuales. Sugiere combinaciones de tipografías modernas y disponibles.
Responde en JSON con:
- font_primary: tipografía para títulos (nombre de Google Font disponible)
- font_secondary: tipografía para cuerpo (nombre de Google Font disponible)
- font_accent: tipografía para acentos opcionales
- pairing_rationale: por qué funcionan juntas
- usage_guidelines: cómo usar cada una`;
        
        userPrompt = `Sugiere tipografías para:
Nombre del restaurante: ${data.brand_name}
Estilo de marca: ${data.brand_style || 'Moderno'}
Tipo de cocina: ${data.cuisine_type || 'No especificado'}

Busca tendencias tipográficas actuales en branding gastronómico.`;
        break;

      case "generate_tagline":
        systemPrompt = `Eres un copywriter experto en gastronomía con acceso a búsqueda web para analizar taglines exitosos de restaurantes. Genera opciones de tagline/eslogan creativos y únicos.
Responde en JSON con:
- taglines: array de 5 opciones de tagline
- recommended: el tagline recomendado
- rationale: por qué el recomendado es el mejor`;
        
        userPrompt = `Genera taglines para:
Nombre: ${data.brand_name}
Tipo de cocina: ${data.cuisine_type || 'No especificado'}
Valores de marca: ${data.brand_values || 'Calidad, sabor, servicio'}
Diferenciador: ${data.differentiator || 'No especificado'}

Busca ejemplos de taglines exitosos de restaurantes similares para inspiración.`;
        break;

      case "generate_brand_manual":
        systemPrompt = `Eres un consultor de branding experto con acceso a búsqueda web para mejores prácticas actuales de branding gastronómico. Genera un manual de marca resumido pero completo.
Responde en JSON con:
- brand_essence: esencia de la marca (2-3 oraciones)
- mission: misión
- vision: visión
- values: array de valores
- brand_personality: personalidad de marca
- tone_of_voice: tono de comunicación
- do_and_dont: qué hacer y qué no hacer con la marca
- application_guidelines: guías de aplicación`;
        
        userPrompt = `Genera manual de marca para:
Nombre: ${data.brand_name}
Tagline: ${data.tagline || 'No definido'}
Colores: Primario ${data.primary_color}, Secundario ${data.secondary_color}
Tipografías: ${data.font_primary}, ${data.font_secondary}
Tipo de restaurante: ${data.cuisine_type || 'No especificado'}
Voz de marca: ${data.brand_voice || 'No definida'}

Busca mejores prácticas actuales de manuales de marca para restaurantes.`;
        break;

      default:
        throw new Error("Acción no válida");
    }

    console.log(`Calling OpenAI GPT-5-mini with web search for brand generation: ${action}`);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1500,
        tools: [{ type: 'web_search_preview' }],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Se requiere pago." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      result = { response: content };
    }

    console.log(`Brand AI generator completed: ${action}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in brand-ai-generator:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
