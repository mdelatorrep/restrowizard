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
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured');
      return new Response(JSON.stringify({ error: 'AI service not configured', success: false }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { module, action, data } = await req.json();
    console.log(`AI Agent request - Module: ${module}, Action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (module) {
      case 'finances':
        systemPrompt = `Eres un asistente especialista en finanzas para restaurantes con acceso a búsqueda web para obtener datos actualizados de mercado, benchmarks de la industria y tendencias de costos. Analizas datos financieros, detectas anomalías en costos, generas predicciones de rentabilidad y sugieres precios dinámicos. Respondes en español con datos concretos y recomendaciones accionables. Sé conciso pero completo.`;
        break;
      
      case 'talent':
        systemPrompt = `Eres un asistente especialista en gestión de talento humano para restaurantes con acceso a búsqueda web para obtener información actualizada sobre salarios de mercado, regulaciones laborales y mejores prácticas de RRHH. Optimizas horarios de personal, analizas candidatos para reclutamiento, personalizas programas de capacitación y evalúas el rendimiento. Respondes en español con sugerencias prácticas y accionables.`;
        break;
      
      case 'operations':
        systemPrompt = `Eres un asistente especialista en operaciones y experiencia del cliente para restaurantes con acceso a búsqueda web para obtener tendencias actuales de consumidores, tecnologías de gestión y mejores prácticas operativas. Analizas patrones de comportamiento de clientes, optimizas programas de lealtad, generas insights de marketing predictivo y mejoras la satisfacción del cliente. Respondes en español con recomendaciones claras.`;
        break;
      
      case 'menu-inventory':
        systemPrompt = `Eres un asistente especialista en ingeniería de menú e inventario para restaurantes con acceso a búsqueda web para obtener precios actuales de ingredientes, tendencias gastronómicas y datos de proveedores. Analizas la rentabilidad de platos, optimizas inventario, sugieres mejoras en empaques para delivery y recomiendas nuevos productos. Respondes en español con análisis detallados y prácticos.`;
        break;
      
      case 'sustainability':
        systemPrompt = `Eres un experto en sostenibilidad y ESG para restaurantes con acceso a búsqueda web para obtener normativas ambientales actualizadas, certificaciones disponibles y proveedores sostenibles. Analizas huella de carbono, desperdicio alimenticio, consumo de agua y energía, y cumplimiento ESG. Proporcionas recomendaciones prácticas para reducir impacto ambiental y ahorrar costos. Respondes en español.`;
        break;
      
      default:
        systemPrompt = `Eres un asistente IA especializado en gestión de restaurantes con acceso a búsqueda web para información actualizada. Ayudas con análisis de datos, optimización de operaciones, finanzas, talento y sostenibilidad. Respondes en español de manera clara y práctica.`;
    }

    // Define specific prompts based on action
    switch (action) {
      case 'analyze_profitability':
        userPrompt = `Analiza la rentabilidad actual y predice la futura basándote en estos datos: ${JSON.stringify(data)}. 
        
Proporciona:
1. Resumen de la situación financiera actual
2. Predicción para los próximos 3 meses
3. Top 3 recomendaciones para mejorar la rentabilidad
4. Alertas de costos que requieren atención
5. Comparación con benchmarks de la industria (busca datos actuales)`;
        break;
      
      case 'detect_cost_anomalies':
        userPrompt = `Detecta anomalías en estos costos de restaurante: ${JSON.stringify(data)}. 

Identifica:
1. Costos que están fuera del rango normal
2. Patrones inusuales en el gasto
3. Posibles causas de cada anomalía
4. Acciones correctivas inmediatas recomendadas
5. Compara con precios de mercado actuales`;
        break;
      
      case 'optimize_pricing':
        userPrompt = `Genera recomendaciones de precios dinámicos para estos platos: ${JSON.stringify(data)}.

Considera:
1. Demanda actual por horario y día
2. Costos de ingredientes (busca precios actuales de mercado)
3. Márgenes de ganancia objetivo
4. Elasticidad de precio del cliente
5. Tendencias de precios en restaurantes similares`;
        break;
      
      case 'staff_optimization':
        userPrompt = `Optimiza los horarios de personal basándote en: ${JSON.stringify(data)}. 

Proporciona:
1. Distribución óptima de personal por turno
2. Estimación de ahorro en costos laborales
3. Horarios donde hay exceso o falta de personal
4. Recomendaciones de contratación si es necesario
5. Salarios de mercado actuales para cada posición`;
        break;
      
      case 'analyze_candidates':
        userPrompt = `Analiza estos candidatos para posiciones de restaurante: ${JSON.stringify(data)}. 

Evalúa:
1. Compatibilidad cultural con el equipo
2. Experiencia relevante
3. Potencial de crecimiento
4. Ranking de los mejores candidatos con justificación
5. Rangos salariales de mercado para estas posiciones`;
        break;
      
      case 'customer_insights':
        userPrompt = `Analiza estos datos de comportamiento de clientes: ${JSON.stringify(data)}. 

Genera:
1. Segmentación de clientes más rentables
2. Patrones de compra por horario y día
3. Oportunidades de upselling
4. Estrategias de retención personalizadas
5. Tendencias actuales de consumidores en restaurantes`;
        break;
      
      case 'menu_engineering':
        userPrompt = `Realiza ingeniería de menú con estos datos: ${JSON.stringify(data)}. 

Proporciona:
1. Clasificación de platos (Estrellas, Vacas Lecheras, Incógnitas, Perros)
2. Recomendaciones de precio por plato
3. Platos a promocionar y a descontinuar
4. Nuevos platos sugeridos basados en tendencias actuales
5. Precios de referencia de mercado para ingredientes clave`;
        break;
      
      case 'inventory_prediction':
        userPrompt = `Predice las necesidades de inventario: ${JSON.stringify(data)}. 

Incluye:
1. Proyección de demanda por ingrediente
2. Cantidades óptimas de pedido
3. Alertas de productos próximos a escasez
4. Oportunidades de reducir desperdicio
5. Precios actuales de mercado y proveedores alternativos`;
        break;

      case 'sustainability_analysis':
        userPrompt = `Analiza estos datos de sostenibilidad del restaurante: ${JSON.stringify(data)}.

Proporciona:
1. Resumen de huella ambiental actual
2. Áreas de mejora prioritarias
3. Acciones concretas para reducir impacto con costos estimados
4. Estimación de ahorro potencial
5. Certificaciones y normativas ambientales aplicables`;
        break;
      
      default:
        userPrompt = `Analiza estos datos de restaurante y proporciona insights relevantes: ${JSON.stringify(data)}. Sé específico y práctico en tus recomendaciones. Incluye datos de mercado actuales cuando sea relevante.`;
    }

    console.log(`Sending request to OpenAI GPT-5-mini with web search...`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2500,
        tools: [{ type: 'web_search_preview' }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error: ${response.status} - ${errorText}`);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Límite de solicitudes excedido. Por favor intenta de nuevo en unos minutos.', 
          success: false 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Se requiere agregar créditos al workspace.', 
          success: false 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const analysis = aiResponse.choices?.[0]?.message?.content || 'No se pudo generar el análisis.';

    console.log(`AI analysis completed successfully for ${module}/${action}`);

    return new Response(JSON.stringify({ analysis, success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI restaurant agent:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Error en el servicio de IA', 
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
