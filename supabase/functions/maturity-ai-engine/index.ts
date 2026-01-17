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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { action, diagnosisData, restaurantContext } = await req.json();

    console.log(`🧙‍♂️ Maturity AI Engine - Action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';
    let responseSchema: any = null;

    switch (action) {
      case 'analyze_diagnosis':
        systemPrompt = `Eres un consultor experto en restaurantes con 20+ años de experiencia en la industria gastronómica.
Tu rol es analizar diagnósticos de madurez de restaurantes y proporcionar insights accionables.
Siempre respondes en español y de forma profesional pero cercana.
Usas datos de la industria para contextualizar tus recomendaciones.
Eres directo y priorizas las acciones de mayor impacto.`;

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

Proporciona un análisis ejecutivo estructurado con:
1. Resumen ejecutivo (2-3 oraciones clave)
2. Fortalezas principales (máximo 3)
3. Áreas críticas de mejora (máximo 3)
4. Oportunidad más importante de corto plazo
5. Riesgo principal si no se toman acciones`;

        responseSchema = {
          type: "json_schema",
          json_schema: {
            name: "diagnosis_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                executive_summary: { type: "string", description: "Resumen ejecutivo de 2-3 oraciones" },
                strengths: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      pillar: { type: "string" },
                      description: { type: "string" }
                    },
                    required: ["pillar", "description"],
                    additionalProperties: false
                  }
                },
                critical_areas: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      pillar: { type: "string" },
                      issue: { type: "string" },
                      impact: { type: "string" }
                    },
                    required: ["pillar", "issue", "impact"],
                    additionalProperties: false
                  }
                },
                quick_opportunity: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    expected_impact: { type: "string" },
                    timeframe: { type: "string" }
                  },
                  required: ["title", "description", "expected_impact", "timeframe"],
                  additionalProperties: false
                },
                main_risk: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    consequences: { type: "string" }
                  },
                  required: ["title", "description", "consequences"],
                  additionalProperties: false
                }
              },
              required: ["executive_summary", "strengths", "critical_areas", "quick_opportunity", "main_risk"],
              additionalProperties: false
            }
          }
        };
        break;

      case 'generate_action_plan':
        systemPrompt = `Eres un consultor estratégico de restaurantes especializado en transformación de negocios.
Creas planes de acción detallados, priorizados y medibles.
Tus recomendaciones están basadas en mejores prácticas de la industria y ROI comprobado.
Siempre consideras la capacidad de ejecución del negocio.
Respondes en español con un tono profesional y motivador.`;

        userPrompt = `Genera un plan de acción personalizado para el siguiente restaurante:

DIAGNÓSTICO DE MADUREZ:
${Object.entries(diagnosisData.pillarScores).map(([pillarId, score]) => 
  `- ${PILLAR_NAMES[pillarId]}: ${(score as number).toFixed(2)}/5`
).join('\n')}
Score General: ${diagnosisData.overallScore.toFixed(2)}/5 (${diagnosisData.overallLevel})

${restaurantContext ? `CONTEXTO:
- Tipo: ${restaurantContext.businessType || 'Restaurante'}
- Empleados: ${restaurantContext.employeeCount || 'No especificado'}
- Ticket promedio: ${restaurantContext.averageTicket ? `$${restaurantContext.averageTicket}` : 'No especificado'}` : ''}

Crea un plan con:
1. Quick Wins (acciones de impacto rápido, < 2 semanas)
2. Acciones prioritarias (impacto alto, 1-3 meses)
3. Iniciativas estratégicas (largo plazo, 3-6 meses)
4. KPIs para medir progreso
5. Estimación de ROI esperado

Para cada acción incluye: título, descripción, pilar relacionado, recursos necesarios, y métricas de éxito.`;

        responseSchema = {
          type: "json_schema",
          json_schema: {
            name: "action_plan",
            strict: true,
            schema: {
              type: "object",
              properties: {
                overview: { type: "string", description: "Resumen del plan" },
                estimated_roi: { type: "string", description: "ROI estimado del plan completo" },
                quick_wins: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      title: { type: "string" },
                      description: { type: "string" },
                      pillar_id: { type: "string" },
                      resources: { type: "string" },
                      success_metric: { type: "string" },
                      timeframe: { type: "string" },
                      effort: { type: "string", enum: ["bajo", "medio", "alto"] },
                      impact: { type: "string", enum: ["bajo", "medio", "alto"] }
                    },
                    required: ["id", "title", "description", "pillar_id", "resources", "success_metric", "timeframe", "effort", "impact"],
                    additionalProperties: false
                  }
                },
                priority_actions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      title: { type: "string" },
                      description: { type: "string" },
                      pillar_id: { type: "string" },
                      resources: { type: "string" },
                      success_metric: { type: "string" },
                      timeframe: { type: "string" },
                      effort: { type: "string", enum: ["bajo", "medio", "alto"] },
                      impact: { type: "string", enum: ["bajo", "medio", "alto"] }
                    },
                    required: ["id", "title", "description", "pillar_id", "resources", "success_metric", "timeframe", "effort", "impact"],
                    additionalProperties: false
                  }
                },
                strategic_initiatives: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      title: { type: "string" },
                      description: { type: "string" },
                      pillar_id: { type: "string" },
                      resources: { type: "string" },
                      success_metric: { type: "string" },
                      timeframe: { type: "string" },
                      effort: { type: "string", enum: ["bajo", "medio", "alto"] },
                      impact: { type: "string", enum: ["bajo", "medio", "alto"] }
                    },
                    required: ["id", "title", "description", "pillar_id", "resources", "success_metric", "timeframe", "effort", "impact"],
                    additionalProperties: false
                  }
                },
                kpis: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      current_baseline: { type: "string" },
                      target: { type: "string" },
                      measurement_frequency: { type: "string" }
                    },
                    required: ["name", "current_baseline", "target", "measurement_frequency"],
                    additionalProperties: false
                  }
                }
              },
              required: ["overview", "estimated_roi", "quick_wins", "priority_actions", "strategic_initiatives", "kpis"],
              additionalProperties: false
            }
          }
        };
        break;

      case 'benchmark_comparison':
        systemPrompt = `Eres un analista de datos especializado en benchmarking de la industria restaurantera.
Tienes acceso a datos agregados de miles de restaurantes en Latinoamérica.
Proporcionas comparativas honestas y contextualizadas.
Identificas gaps y oportunidades basadas en datos reales de la industria.
Respondes en español con precisión y claridad.`;

        userPrompt = `Compara el siguiente diagnóstico con benchmarks de la industria:

SCORES DEL RESTAURANTE:
${Object.entries(diagnosisData.pillarScores).map(([pillarId, score]) => 
  `- ${PILLAR_NAMES[pillarId]}: ${(score as number).toFixed(2)}/5`
).join('\n')}
Score General: ${diagnosisData.overallScore.toFixed(2)}/5

${restaurantContext?.businessType ? `Tipo de negocio: ${restaurantContext.businessType}` : ''}

Proporciona:
1. Comparación con el promedio de la industria por pilar
2. Posición percentil estimada
3. Áreas donde está por encima/debajo del promedio
4. Oportunidades basadas en tendencias de la industria`;

        responseSchema = {
          type: "json_schema",
          json_schema: {
            name: "benchmark_comparison",
            strict: true,
            schema: {
              type: "object",
              properties: {
                overall_percentile: { type: "number", description: "Percentil general 0-100" },
                industry_average: { type: "number", description: "Promedio industria 1-5" },
                pillar_comparisons: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      pillar_id: { type: "string" },
                      pillar_name: { type: "string" },
                      user_score: { type: "number" },
                      industry_average: { type: "number" },
                      percentile: { type: "number" },
                      status: { type: "string", enum: ["above", "at", "below"] },
                      gap: { type: "number" }
                    },
                    required: ["pillar_id", "pillar_name", "user_score", "industry_average", "percentile", "status", "gap"],
                    additionalProperties: false
                  }
                },
                top_opportunities: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      industry_trend: { type: "string" }
                    },
                    required: ["title", "description", "industry_trend"],
                    additionalProperties: false
                  }
                },
                competitive_insight: { type: "string", description: "Insight competitivo clave" }
              },
              required: ["overall_percentile", "industry_average", "pillar_comparisons", "top_opportunities", "competitive_insight"],
              additionalProperties: false
            }
          }
        };
        break;

      case 'progress_insights':
        systemPrompt = `Eres un coach de negocios especializado en restaurantes.
Analizas el progreso y motivas a los empresarios con insights accionables.
Celebras los logros y reenfocas en las áreas que necesitan atención.
Eres positivo pero realista en tus evaluaciones.
Respondes en español con energía y claridad.`;

        userPrompt = `Analiza el progreso del siguiente restaurante:

DIAGNÓSTICO ACTUAL:
${Object.entries(diagnosisData.pillarScores).map(([pillarId, score]) => 
  `- ${PILLAR_NAMES[pillarId]}: ${(score as number).toFixed(2)}/5`
).join('\n')}

Genera insights motivacionales y próximos pasos.`;

        responseSchema = {
          type: "json_schema",
          json_schema: {
            name: "progress_insights",
            strict: true,
            schema: {
              type: "object",
              properties: {
                celebration: { type: "string", description: "Logro a celebrar" },
                focus_area: { type: "string", description: "Área de enfoque inmediato" },
                motivation_message: { type: "string", description: "Mensaje motivacional" },
                next_milestone: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    target_date: { type: "string" }
                  },
                  required: ["title", "description", "target_date"],
                  additionalProperties: false
                }
              },
              required: ["celebration", "focus_area", "motivation_message", "next_milestone"],
              additionalProperties: false
            }
          }
        };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log('📡 Calling Lovable AI Gateway...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: responseSchema,
        temperature: 0.7,
        max_tokens: 4000
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
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
      JSON.stringify({ success: true, data: result, action }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in maturity-ai-engine:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
