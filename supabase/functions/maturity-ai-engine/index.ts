import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAIGateway, gatewayErrorResponse, safeParseJson } from "../_shared/ai-gateway.ts";
import { webResearch, formatSourcesForPrompt } from "../_shared/web-research.ts";
import { composeSystemPrompt, checkIntegrity } from "../_shared/ai-guardrails.ts";

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
    // LOVABLE_API_KEY handled by callAIGateway helper

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
        systemPrompt = `Eres un analista de datos especializado en benchmarking de la industria restaurantera.
Proporcionas comparativas honestas y contextualizadas.
Respondes en español con precisión y claridad.

Responde SIEMPRE en formato JSON válido con la estructura especificada y con TIPOS correctos (números donde se piden números).`;

        userPrompt = `Compara el siguiente diagnóstico con benchmarks de la industria restaurantera en Latinoamérica.

SCORES DEL RESTAURANTE (escala 0-5):
${Object.entries(diagnosisData.pillarScores).map(([pillarId, score]) =>
  `- ${pillarId}|${PILLAR_NAMES[pillarId]}: ${(score as number).toFixed(2)}/5`
).join('\n')}
Score General: ${diagnosisData.overallScore.toFixed(2)}/5

${restaurantContext?.businessType ? `Tipo de negocio: ${restaurantContext.businessType}` : ''}
${restaurantContext?.location ? `Ubicación: ${restaurantContext.location}` : ''}

Devuelve JSON EXACTAMENTE con esta forma (todos los campos numéricos son NÚMEROS, no strings):
{
  "overall_percentile": <number 0-100>,
  "industry_average": <number 0-5>,
  "pillar_comparisons": [
    {
      "pillar_id": "p1",
      "pillar_name": "Rentabilidad y Finanzas",
      "user_score": <number>,
      "industry_average": <number 0-5>,
      "percentile": <number 0-100>,
      "status": "above" | "at" | "below",
      "gap": <number, user_score - industry_average>
    }
    // ... una entrada por cada pilar enviado
  ],
  "top_opportunities": [
    { "title": "<string>", "description": "<string>", "industry_trend": "<string>" }
  ],
  "competitive_insight": "<string, marca estimaciones con 'Estimación:' si no hay fuente web>"
}

Si no tienes fuentes externas verificadas, usa estimaciones razonables basadas en rangos típicos del sector restaurantero LATAM. NO devuelvas strings en los campos numéricos.`;
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

    // Web research pluggable: benchmarks/best-practices según la acción
    const webQuery = (() => {
      const ctx = `${restaurantContext?.businessType || 'restaurante'} ${restaurantContext?.location || 'Latinoamérica'}`;
      if (action === 'analyze_diagnosis') return `benchmark madurez operativa restaurantes ${ctx}`;
      if (action === 'generate_action_plan') return `mejores prácticas plan de acción restaurantes ${ctx} ROI`;
      if (action === 'benchmark_comparison') return `benchmark industria restaurantera Latinoamérica KPIs 2026`;
      if (action === 'progress_insights') return `historias éxito restaurantes ${ctx}`;
      return '';
    })();
    const research = await webResearch(webQuery, { limit: 4, scrape: false, logPrefix: `[maturity:${action}]` });

    const wrappedSystem = composeSystemPrompt({
      guardrails: { jsonOutput: true, requireConfidence: true, domain: "diagnóstico de madurez de restaurantes" },
      rolePrompt: systemPrompt,
      webContextBlock: formatSourcesForPrompt(research),
    });

    const aiResult = await callAIGateway({
      messages: [
        { role: "system", content: wrappedSystem },
        { role: "user", content: userPrompt },
      ],
      tier: "reasoning",
      maxTokens: 4000,
      temperature: 0.7,
      jsonMode: true,
      logPrefix: "[maturity-ai-engine]",
    });
    if (!aiResult.ok) return gatewayErrorResponse(aiResult, corsHeaders);
    const result = safeParseJson(aiResult.content);

    if (!result) {
      return new Response(
        JSON.stringify({ success: false, error: 'No se pudo procesar la respuesta de IA. Intenta de nuevo.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const integrity = checkIntegrity(aiResult.content, research.enabled);

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        meta: {
          web_research: { enabled: research.enabled, provider: research.provider, sources_count: research.sources.length },
          integrity,
        },
      }),
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
