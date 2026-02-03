import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiagnosisData {
  pillarScores: Record<string, number>;
  overallScore: number;
  overallLevel: string;
  answers: Record<number, number>;
}

interface RestaurantContext {
  businessType?: string;
  location?: string;
  employeeCount?: number;
  averageTicket?: number;
  yearsOperating?: number;
  cuisineType?: string;
  seatingCapacity?: number;
}

const PILLAR_NAMES: Record<string, string> = {
  'p1': 'Rentabilidad y Finanzas',
  'p2': 'Operaciones y Cadena de Suministro',
  'p3': 'Talento y Cultura',
  'p4': 'Experiencia del Cliente y Tecnología'
};

const LEVEL_NAMES: Record<number, string> = {
  1: 'INICIAL',
  2: 'BÁSICO',
  3: 'INTERMEDIO',
  4: 'AVANZADO',
  5: 'EXPERTO'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const { action, diagnosisData, restaurantContext } = await req.json();

    console.log(`🧙‍♂️ Maturity AI Engine - Action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'analyze_diagnosis':
        systemPrompt = `Eres un consultor experto en restaurantes con 20+ años de experiencia en la industria gastronómica y acceso a búsqueda web para datos actuales de la industria.
Tu rol es analizar diagnósticos de madurez de restaurantes y proporcionar insights accionables basados en benchmarks actuales.
Siempre respondes en español y de forma profesional pero cercana.
Usas datos de la industria actualizados para contextualizar tus recomendaciones.
Eres directo y priorizas las acciones de mayor impacto.

Responde SIEMPRE en formato JSON válido con la estructura especificada.`;

        userPrompt = `Analiza el siguiente diagnóstico de madurez de un restaurante:

SCORES POR PILAR (escala 1-5):
${Object.entries(diagnosisData.pillarScores).map(([pillarId, score]) => 
  `- ${PILLAR_NAMES[pillarId]}: ${(score as number).toFixed(2)} (${LEVEL_NAMES[Math.round(score as number)]})`
).join('\n')}

SCORE GENERAL: ${diagnosisData.overallScore.toFixed(2)} - Nivel ${diagnosisData.overallLevel}

${restaurantContext ? `CONTEXTO DEL RESTAURANTE:
- Tipo de negocio: ${restaurantContext.businessType || 'No especificado'}
- Ubicación: ${restaurantContext.location || 'No especificada'}
- Empleados: ${restaurantContext.employeeCount || 'No especificado'}
- Ticket promedio: ${restaurantContext.averageTicket ? `$${restaurantContext.averageTicket}` : 'No especificado'}
- Años operando: ${restaurantContext.yearsOperating || 'No especificado'}
- Tipo de cocina: ${restaurantContext.cuisineType || 'No especificado'}` : ''}

Busca benchmarks actuales de la industria para restaurantes similares y proporciona un análisis ejecutivo estructurado con:
1. Resumen ejecutivo (2-3 oraciones clave)
2. Fortalezas principales (máximo 3)
3. Áreas críticas de mejora (máximo 3)
4. Oportunidad más importante de corto plazo
5. Riesgo principal si no se toman acciones

Responde en JSON con: executive_summary, strengths (array con pillar, description), critical_areas (array con pillar, issue, impact), quick_opportunity (objeto con title, description, expected_impact, timeframe), main_risk (objeto con title, description, consequences)`;
        break;

      case 'generate_action_plan':
        systemPrompt = `Eres un consultor estratégico de restaurantes especializado en transformación de negocios con acceso a búsqueda web para mejores prácticas actuales y costos de mercado.
Creas planes de acción detallados, priorizados y medibles.
Tus recomendaciones están basadas en mejores prácticas de la industria y ROI comprobado.
Siempre consideras la capacidad de ejecución del negocio.
Respondes en español con un tono profesional y motivador.

Responde SIEMPRE en formato JSON válido con la estructura especificada.`;

        userPrompt = `Genera un plan de acción personalizado para el siguiente restaurante:

DIAGNÓSTICO DE MADUREZ:
${Object.entries(diagnosisData.pillarScores).map(([pillarId, score]) => 
  `- ${PILLAR_NAMES[pillarId]}: ${(score as number).toFixed(2)}/5`
).join('\n')}
Score General: ${diagnosisData.overallScore.toFixed(2)}/5 (${diagnosisData.overallLevel})

${restaurantContext ? `CONTEXTO:
- Tipo: ${restaurantContext.businessType || 'Restaurante'}
- Empleados: ${restaurantContext.employeeCount || 'No especificado'}
- Ticket promedio: ${restaurantContext.averageTicket ? `$${restaurantContext.averageTicket}` : 'No especificado'}
- Ubicación: ${restaurantContext.location || 'No especificada'}` : ''}

Busca mejores prácticas actuales y costos de mercado para crear un plan con:
1. Quick Wins (acciones de impacto rápido, < 2 semanas)
2. Acciones prioritarias (impacto alto, 1-3 meses)
3. Iniciativas estratégicas (largo plazo, 3-6 meses)
4. KPIs para medir progreso
5. Estimación de ROI esperado

Para cada acción incluye: título, descripción, pilar relacionado, recursos necesarios, y métricas de éxito.

Responde en JSON con: overview, estimated_roi, quick_wins (array), priority_actions (array), strategic_initiatives (array), kpis (array)`;
        break;

      case 'benchmark_comparison':
        systemPrompt = `Eres un analista de datos especializado en benchmarking de la industria restaurantera con acceso a búsqueda web para obtener datos actualizados de la industria.
Tienes acceso a datos agregados de miles de restaurantes en Latinoamérica.
Proporcionas comparativas honestas y contextualizadas.
Identificas gaps y oportunidades basadas en datos reales de la industria.
Respondes en español con precisión y claridad.

Responde SIEMPRE en formato JSON válido con la estructura especificada.`;

        userPrompt = `Compara el siguiente diagnóstico con benchmarks actuales de la industria:

SCORES DEL RESTAURANTE:
${Object.entries(diagnosisData.pillarScores).map(([pillarId, score]) => 
  `- ${PILLAR_NAMES[pillarId]}: ${(score as number).toFixed(2)}/5`
).join('\n')}
Score General: ${diagnosisData.overallScore.toFixed(2)}/5

${restaurantContext?.businessType ? `Tipo de negocio: ${restaurantContext.businessType}` : ''}
${restaurantContext?.location ? `Ubicación: ${restaurantContext.location}` : ''}

Busca benchmarks actuales de la industria restaurantera en Latinoamérica y proporciona:
1. Comparación con el promedio de la industria por pilar
2. Posición percentil estimada
3. Áreas donde está por encima/debajo del promedio
4. Oportunidades basadas en tendencias de la industria

Responde en JSON con: overall_percentile, industry_average, pillar_comparisons (array), top_opportunities (array), competitive_insight`;
        break;

      case 'progress_insights':
        systemPrompt = `Eres un coach de negocios especializado en restaurantes con acceso a búsqueda web para historias de éxito y mejores prácticas.
Analizas el progreso y motivas a los empresarios con insights accionables.
Celebras los logros y reenfocas en las áreas que necesitan atención.
Eres positivo pero realista en tus evaluaciones.
Respondes en español con energía y claridad.

Responde SIEMPRE en formato JSON válido con la estructura especificada.`;

        userPrompt = `Analiza el progreso del siguiente restaurante:

DIAGNÓSTICO ACTUAL:
${Object.entries(diagnosisData.pillarScores).map(([pillarId, score]) => 
  `- ${PILLAR_NAMES[pillarId]}: ${(score as number).toFixed(2)}/5`
).join('\n')}

Busca historias de éxito de restaurantes similares y genera insights motivacionales y próximos pasos.

Responde en JSON con: celebration, focus_area, motivation_message, next_milestone (objeto con title, description, target_date)`;
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log('📡 Calling OpenAI API...');

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('OpenAI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Límite de solicitudes excedido. Por favor intenta más tarde.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Se requiere agregar créditos. Por favor contacta a soporte.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`OpenAI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('✅ AI Response received');

    let result;
    try {
      const content = aiData.choices?.[0]?.message?.content;
      result = typeof content === 'string' ? JSON.parse(content) : content;
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      result = aiData.choices?.[0]?.message?.content;
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Maturity AI Engine error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
