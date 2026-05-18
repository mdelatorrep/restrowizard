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

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "calculate_cost":
        systemPrompt = `Eres un experto en costeo de recetas para restaurantes con acceso a búsqueda web para obtener precios actuales de ingredientes en el mercado. Dado los ingredientes y sus costos, calcula:
- Costo total de la receta
- Costo por porción
- Sugerencia de precio de venta (considerando un food cost objetivo del 30%)
- Margen de ganancia
- Compara con precios de mercado actuales

Responde en JSON con: total_cost, cost_per_portion, suggested_price, profit_margin_percent, market_comparison, analysis`;
        
        userPrompt = `Calcula el costo de esta receta:
Nombre: ${data.recipe_name}
Porciones: ${data.portions || 1}
Ingredientes:
${data.ingredients?.map((i: any) => `- ${i.ingredient_name}: ${i.quantity} ${i.unit} @ $${i.unit_cost || 0}`).join('\n') || 'Sin ingredientes'}

Busca precios actuales de mercado para estos ingredientes y compara.`;
        break;

      case "suggest_improvements":
        systemPrompt = `Eres un chef consultor experto con acceso a búsqueda web para tendencias culinarias y técnicas modernas. Analiza la receta y sugiere mejoras para:
- Optimizar costos sin sacrificar calidad
- Mejorar la presentación según tendencias actuales
- Alternativas de ingredientes con precios de mercado
- Técnicas de preparación más eficientes

Responde en JSON con: cost_suggestions, presentation_tips, ingredient_alternatives, technique_improvements, trend_recommendations`;
        
        userPrompt = `Analiza esta receta y sugiere mejoras:
Nombre: ${data.recipe_name}
Categoría: ${data.category}
Descripción: ${data.description}
Tiempo de preparación: ${data.prep_time_minutes} min
Ingredientes: ${data.ingredients?.map((i: any) => i.ingredient_name).join(', ') || 'No especificados'}
Instrucciones: ${data.instructions || 'No especificadas'}

Busca tendencias culinarias actuales para mejorar esta receta.`;
        break;

      case "generate_description":
        systemPrompt = `Eres un experto en marketing gastronómico con acceso a búsqueda web para analizar descripciones de menú exitosas. Genera una descripción atractiva para el menú que:
- Sea apetitosa y evocadora
- Mencione ingredientes destacados
- Tenga máximo 50 palabras
- Sea profesional pero accesible
- Siga tendencias actuales de copywriting gastronómico`;
        
        userPrompt = `Genera una descripción de menú para:
Nombre: ${data.recipe_name}
Ingredientes principales: ${data.ingredients?.slice(0, 5).map((i: any) => i.ingredient_name).join(', ') || 'No especificados'}
Categoría: ${data.category}

Busca ejemplos de descripciones de menú exitosas para inspiración.`;
        break;

      case "scale_recipe":
        systemPrompt = `Eres un chef experto en escalar recetas con conocimiento de rendimientos de ingredientes. Calcula las cantidades ajustadas de ingredientes para la nueva cantidad de porciones.
Responde en JSON con: scaled_ingredients (array con ingredient_name, original_quantity, scaled_quantity, unit), notes (consideraciones para el escalado)`;
        
        userPrompt = `Escala esta receta de ${data.original_portions} a ${data.new_portions} porciones:
Ingredientes actuales:
${data.ingredients?.map((i: any) => `- ${i.ingredient_name}: ${i.quantity} ${i.unit}`).join('\n') || 'Sin ingredientes'}`;
        break;

      default:
        throw new Error("Acción no válida");
    }

    console.log(`Calling OpenAI GPT-5-mini with web search for recipe assistant: ${action}`);

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

    console.log(`Recipe AI assistant completed: ${action}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in recipe-ai-assistant:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
