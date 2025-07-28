import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!openAIApiKey) {
    return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { module, action, data } = await req.json();

    let systemPrompt = '';
    let userPrompt = '';

    switch (module) {
      case 'finances':
        systemPrompt = `Eres un asistente especialista en finanzas para restaurantes. Analizas datos financieros, detectas anomalías en costos, generas predicciones de rentabilidad y sugieres precios dinámicos. Respondes en español con datos concretos y recomendaciones accionables.`;
        break;
      
      case 'talent':
        systemPrompt = `Eres un asistente especialista en gestión de talento humano para restaurantes. Optimizas horarios de personal, analizas candidatos para reclutamiento, personalizas programas de capacitación y evalúas el rendimiento. Respondes en español con sugerencias prácticas.`;
        break;
      
      case 'operations':
        systemPrompt = `Eres un asistente especialista en operaciones y experiencia del cliente para restaurantes. Analizas patrones de comportamiento de clientes, optimizas programas de lealtad, generas insights de marketing predictivo y mejoras la satisfacción del cliente. Respondes en español.`;
        break;
      
      case 'menu-inventory':
        systemPrompt = `Eres un asistente especialista en ingeniería de menú e inventario para restaurantes. Analizas la rentabilidad de platos, optimizas inventario, sugieres mejoras en empaques para delivery y recomiendas nuevos productos. Respondes en español con análisis detallados.`;
        break;
      
      default:
        throw new Error('Módulo no válido');
    }

    // Define specific prompts based on action
    switch (action) {
      case 'analyze_profitability':
        userPrompt = `Analiza la rentabilidad actual y predice la futura basándote en estos datos: ${JSON.stringify(data)}. Proporciona insights específicos y recomendaciones para mejorar la rentabilidad.`;
        break;
      
      case 'detect_cost_anomalies':
        userPrompt = `Detecta anomalías en estos costos de restaurante: ${JSON.stringify(data)}. Identifica patrones inusuales y sugiere acciones correctivas inmediatas.`;
        break;
      
      case 'optimize_pricing':
        userPrompt = `Genera recomendaciones de precios dinámicos para estos platos basándote en: demanda actual, costos, competencia y factores externos: ${JSON.stringify(data)}`;
        break;
      
      case 'staff_optimization':
        userPrompt = `Optimiza los horarios de personal basándote en estos patrones de tráfico y datos históricos: ${JSON.stringify(data)}. Sugiere la cantidad óptima de personal por turno.`;
        break;
      
      case 'analyze_candidates':
        userPrompt = `Analiza estos candidatos para posiciones de restaurante: ${JSON.stringify(data)}. Evalúa su fit cultural, experiencia y potencial de éxito.`;
        break;
      
      case 'customer_insights':
        userPrompt = `Analiza estos datos de comportamiento de clientes: ${JSON.stringify(data)}. Genera insights sobre patrones de compra, preferencias y oportunidades de retención.`;
        break;
      
      case 'menu_engineering':
        userPrompt = `Realiza ingeniería de menú con estos datos de ventas y costos: ${JSON.stringify(data)}. Clasifica los platos y sugiere optimizaciones.`;
        break;
      
      case 'inventory_prediction':
        userPrompt = `Predice las necesidades de inventario basándote en estos datos históricos y tendencias: ${JSON.stringify(data)}. Sugiere cantidades óptimas de pedido.`;
        break;
      
      default:
        userPrompt = `Analiza estos datos de restaurante y proporciona insights relevantes: ${JSON.stringify(data)}`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const aiResponse = await response.json();
    const analysis = aiResponse.choices[0].message.content;

    return new Response(JSON.stringify({ analysis, success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI restaurant agent:', error);
    return new Response(JSON.stringify({ error: error.message, success: false }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});