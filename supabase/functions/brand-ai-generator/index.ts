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
    const { action, data } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "generate_palette":
        systemPrompt = `Eres un diseñador de marca experto en restaurantes. Genera una paleta de colores profesional.
Responde en JSON con:
- primary_color: color principal en HEX
- secondary_color: color secundario en HEX
- accent_color: color de acento en HEX
- background_color: color de fondo sugerido en HEX
- text_color: color de texto sugerido en HEX
- rationale: explicación de por qué estos colores funcionan
- mood: palabras que describen el mood (array)`;
        
        userPrompt = `Genera paleta de colores para:
Nombre del restaurante: ${data.brand_name}
Tipo de cocina: ${data.cuisine_type || 'No especificado'}
Ambiente deseado: ${data.desired_mood || 'Profesional y acogedor'}
Público objetivo: ${data.target_audience || 'General'}`;
        break;

      case "suggest_typography":
        systemPrompt = `Eres un tipógrafo experto en branding gastronómico. Sugiere combinaciones de tipografías.
Responde en JSON con:
- font_primary: tipografía para títulos (nombre de Google Font)
- font_secondary: tipografía para cuerpo (nombre de Google Font)
- font_accent: tipografía para acentos opcionales
- pairing_rationale: por qué funcionan juntas
- usage_guidelines: cómo usar cada una`;
        
        userPrompt = `Sugiere tipografías para:
Nombre del restaurante: ${data.brand_name}
Estilo de marca: ${data.brand_style || 'Moderno'}
Tipo de cocina: ${data.cuisine_type || 'No especificado'}`;
        break;

      case "generate_tagline":
        systemPrompt = `Eres un copywriter experto en gastronomía. Genera opciones de tagline/eslogan.
Responde en JSON con:
- taglines: array de 5 opciones de tagline
- recommended: el tagline recomendado
- rationale: por qué el recomendado es el mejor`;
        
        userPrompt = `Genera taglines para:
Nombre: ${data.brand_name}
Tipo de cocina: ${data.cuisine_type || 'No especificado'}
Valores de marca: ${data.brand_values || 'Calidad, sabor, servicio'}
Diferenciador: ${data.differentiator || 'No especificado'}`;
        break;

      case "generate_brand_manual":
        systemPrompt = `Eres un consultor de branding. Genera un manual de marca resumido pero completo.
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
Voz de marca: ${data.brand_voice || 'No definida'}`;
        break;

      default:
        throw new Error("Acción no válida");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
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
      throw new Error(`AI gateway error: ${response.status}`);
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
