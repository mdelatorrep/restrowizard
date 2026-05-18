import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAIGateway } from "../_shared/ai-gateway.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ═══════════════════════════════════════════════════════════════
// PHASES DEFINITION
// ═══════════════════════════════════════════════════════════════
const PHASES = [
  'legal_requirements',
  'location_analysis', 
  'equipment_setup',
  'supplier_network',
  'staffing_plan',
  'marketing_launch',
  'financial_projection',
] as const;

type PhaseId = typeof PHASES[number];

// ═══════════════════════════════════════════════════════════════
// COUNTRY CODE MAPPING FOR USER_LOCATION
// ═══════════════════════════════════════════════════════════════
const COUNTRY_CODES: Record<string, string> = {
  'México': 'MX', 'Mexico': 'MX', 'Colombia': 'CO', 'Argentina': 'AR',
  'Chile': 'CL', 'Perú': 'PE', 'Peru': 'PE', 'Ecuador': 'EC',
  'España': 'ES', 'Spain': 'ES', 'Estados Unidos': 'US', 'United States': 'US',
  'Guatemala': 'GT', 'Costa Rica': 'CR', 'Panamá': 'PA', 'Panama': 'PA',
  'Uruguay': 'UY', 'Paraguay': 'PY', 'Bolivia': 'BO', 'Venezuela': 'VE',
  'Honduras': 'HN', 'El Salvador': 'SV', 'Nicaragua': 'NI',
  'República Dominicana': 'DO', 'Dominican Republic': 'DO',
  'Puerto Rico': 'PR', 'Cuba': 'CU',
};

const getCountryCode = (country: string): string => COUNTRY_CODES[country] || 'MX';

// ═══════════════════════════════════════════════════════════════
// ANTI-HALLUCINATION + DIRECT ACTION GUARDRAILS
// ═══════════════════════════════════════════════════════════════
const ANTI_HALLUCINATION_RULES = `
═══════════════════════════════════════════════════════════════
🚨 REGLA #0 - ACCIÓN DIRECTA (MÁS IMPORTANTE)
═══════════════════════════════════════════════════════════════
- NUNCA preguntes "¿quieres que busque?" o "¿cómo prefieres proceder?"
- NUNCA expliques lo que VAS a hacer - simplemente HAZLO
- NUNCA muestres tu proceso de pensamiento interno
- USA la búsqueda web AUTOMÁTICAMENTE sin pedir permiso
- Entrega DIRECTAMENTE los resultados en formato ejecutivo
- Si no encuentras algo, indica "No disponible - verificar directamente" y continúa

PROHIBIDO responder con:
❌ "Voy a hacer una búsqueda..."
❌ "¿Quieres que te entregue...?"
❌ "Antes de empezar..."
❌ "¿Cómo quieres proceder?"
❌ Cualquier pregunta al usuario

OBLIGATORIO responder con:
✅ Resultados directos en formato ejecutivo
✅ Datos concretos (o indicar que no están disponibles)
✅ Próximos pasos accionables

═══════════════════════════════════════════════════════════════
⚠️ REGLAS DE HONESTIDAD
═══════════════════════════════════════════════════════════════
1. NUNCA inventes nombres de negocios, proveedores o direcciones.
   - Si no encuentras información específica: usa categorías genéricas
   - ✅ "Centrales de abasto de la zona"
   - ❌ "Distribuidora García S.A. en Calle Reforma 123" (inventado)

2. Para precios y costos:
   - Con datos reales: usa el valor específico
   - Sin datos: usa rangos: "Entre $X y $Y aproximadamente"
   - NUNCA inventes números exactos

3. Cuando NO tengas información específica:
   - "Verificar en [institución]" y CONTINÚA con el resto
   - NO te detengas a preguntar

4. Prioriza CALIDAD sobre CANTIDAD:
   - Mejor 3 datos verificables que 10 inventados
═══════════════════════════════════════════════════════════════
`;

const EXECUTIVE_FORMAT_INSTRUCTION = `
FORMATO DE RESPUESTA (OBLIGATORIO - ESTILO EJECUTIVO):
- Máximo 1 página de contenido (NO más de 600 palabras)
- Usar bullets cortos (máximo 15 palabras cada uno)
- Incluir SOLO números clave y métricas importantes
- Terminar cada sección con "→ Próximo paso:" concreto
- NO incluir explicaciones extensas ni párrafos largos
- Usar tablas SOLO para comparativas numéricas (máximo 5 filas)
- Cada bullet debe ser ACCIONABLE, no teórico

ESTRUCTURA REQUERIDA (SIGUE ESTE ORDEN):
## Resumen Ejecutivo
3-4 bullets con lo más importante

## Puntos Clave
5-7 bullets con datos concretos y verificables

## Costos Estimados (si aplica)
Tabla concisa con rangos realistas

## Próximos Pasos
2-3 acciones inmediatas y específicas
`;

function extractJsonFromResponse(responseText: string): unknown {
  let cleaned = responseText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    throw new Error('No se encontró un objeto JSON en la respuesta.');
  }
  cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  try {
    return JSON.parse(cleaned);
  } catch {
    const fixed = cleaned.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']').replace(/[\x00-\x1F\x7F]/g, '');
    return JSON.parse(fixed);
  }
}

function detectTruncation(responseText: string): boolean {
  const text = responseText.trim();
  const openBraces = (text.match(/{/g) || []).length;
  const closeBraces = (text.match(/}/g) || []).length;
  if (openBraces !== closeBraces) return true;
  const truncationPatterns = [/\.\.\.$/, /\u2026$/, /\[truncated\]/i, /\[continued\]/i];
  return truncationPatterns.some((p) => p.test(text));
}

interface ProjectData {
  id?: string;
  projectName: string;
  businessType: string;
  cuisineType?: string;
  description?: string;
  city: string;
  country: string;
  neighborhood?: string;
  estimatedBudget?: number;
}

interface BusinessOpeningRequest {
  action: 'analyze_phase' | 'ask_question' | 'generate_checklist' | 'start_full_analysis' | 'continue_analysis';
  projectData: ProjectData;
  phase?: string;
  question?: string;
  runId?: string;
  projectId?: string;
}

const getLocationContext = (data: ProjectData) => `
📍 CONTEXTO GEOGRÁFICO:
• Ciudad: ${data.city}, ${data.country}
${data.neighborhood ? `• Zona/Barrio: ${data.neighborhood}` : ''}
• Tipo de negocio: ${data.businessType}
${data.cuisineType ? `• Cocina: ${data.cuisineType}` : ''}
${data.description ? `• Concepto: ${data.description}` : ''}
${data.estimatedBudget ? `• Presupuesto: $${data.estimatedBudget.toLocaleString()}` : ''}
`;

// ═══════════════════════════════════════════════════════════════
// PHASE PROMPTS - EXECUTIVE FORMAT WITH ANTI-HALLUCINATION
// ═══════════════════════════════════════════════════════════════
const PHASE_PROMPTS: Record<string, (data: ProjectData) => string> = {
  legal_requirements: (data) => `
${ANTI_HALLUCINATION_RULES}
${EXECUTIVE_FORMAT_INSTRUCTION}
${getLocationContext(data)}

🎯 TAREA: Requisitos legales para ${data.businessType} en ${data.city}, ${data.country}.

USA LA BÚSQUEDA WEB para encontrar información REAL y ACTUAL.

## Resumen Ejecutivo
- 3-4 bullets con los requisitos MÁS críticos

## Permisos Principales
Lista los 5-7 permisos OBLIGATORIOS:
- Nombre del permiso
- Costo aproximado (rango si no hay dato exacto)
- Tiempo estimado
- Dependencia responsable

## Costos Estimados
| Concepto | Rango de Costo |
|----------|----------------|

## Próximos Pasos
1. Primera acción inmediata
2. Segunda acción
3. Tercera acción

⚠️ Si no encuentras el costo o tiempo exacto para un trámite en ${data.city}, indica "Verificar en oficina local" en lugar de inventar.
`,

  location_analysis: (data) => `
${ANTI_HALLUCINATION_RULES}
${EXECUTIVE_FORMAT_INSTRUCTION}
${getLocationContext(data)}

🎯 TAREA: Análisis de ubicación para ${data.businessType} en ${data.city}, ${data.country}.
${data.neighborhood ? `Interés específico en: ${data.neighborhood}` : ''}

USA LA BÚSQUEDA WEB para encontrar información REAL sobre zonas comerciales.

## Resumen Ejecutivo
- 3-4 bullets sobre las mejores opciones de ubicación

## Zonas Recomendadas
Lista 3-5 zonas de ${data.city} ideales para este negocio:
- Nombre de zona
- Por qué es adecuada
- Rango de renta por m²
${data.neighborhood ? `\n### Análisis de ${data.neighborhood}\nEvalúa esta zona específica.` : ''}

## Costos de Renta
| Zona | Renta/m² mensual |
|------|------------------|

## Próximos Pasos
1. Visitar zonas recomendadas
2. Contactar inmobiliarias
3. Verificar uso de suelo

⚠️ Solo menciona zonas y precios que encuentres en la búsqueda web. Si no hay datos específicos, indica rangos generales del mercado.
`,

  equipment_setup: (data) => `
${ANTI_HALLUCINATION_RULES}
${EXECUTIVE_FORMAT_INSTRUCTION}
${getLocationContext(data)}

🎯 TAREA: Equipamiento para ${data.businessType}${data.cuisineType ? ` de cocina ${data.cuisineType}` : ''} en ${data.city}.

USA LA BÚSQUEDA WEB para encontrar precios REALES de equipo en ${data.country}.

## Resumen Ejecutivo
- 3-4 bullets con equipo esencial y rangos de inversión

## Equipo Esencial
Lista los 6-8 equipos INDISPENSABLES:
- Nombre del equipo
- Rango de precio (nuevo)
- Alternativa (usado si aplica)

## Inversión Estimada
| Categoría | Rango de Inversión |
|-----------|-------------------|
| Cocina | $ - $ |
| Refrigeración | $ - $ |
| Mobiliario | $ - $ |
| **Total estimado** | **$ - $** |

## Próximos Pasos
1. Cotizar equipo prioritario
2. Evaluar opciones usadas
3. Revisar financiamiento

⚠️ Los precios deben basarse en búsquedas reales. Si no hay datos específicos, indica "precio a cotizar".
`,

  supplier_network: (data) => `
${ANTI_HALLUCINATION_RULES}
${EXECUTIVE_FORMAT_INSTRUCTION}
${getLocationContext(data)}

🎯 TAREA: Red de proveedores para ${data.businessType}${data.cuisineType ? ` de cocina ${data.cuisineType}` : ''} en ${data.city}.

USA LA BÚSQUEDA WEB para encontrar información sobre mercados y proveedores en ${data.city}.

## Resumen Ejecutivo
- 3-4 bullets sobre dónde conseguir insumos

## Mercados y Centrales de Abasto
Lista los principales puntos de compra en ${data.city}:
- Nombre (si lo encuentras en búsqueda)
- Tipo de productos
- Ubicación general

## Categorías de Proveedores
### Insumos prioritarios:
- Proteínas: dónde buscar
- Vegetales/frutas: opciones
- Abarrotes: mayoristas
- Especialidades: según tipo de cocina

## Costos de Referencia
| Producto | Precio aproximado |
|----------|-------------------|

## Próximos Pasos
1. Visitar mercados principales
2. Solicitar listas de precios
3. Negociar condiciones

⚠️ SOLO incluye nombres de proveedores que encuentres en la búsqueda. Si no hay resultados específicos, indica categorías genéricas.
`,

  staffing_plan: (data) => `
${ANTI_HALLUCINATION_RULES}
${EXECUTIVE_FORMAT_INSTRUCTION}
${getLocationContext(data)}

🎯 TAREA: Plan de personal para ${data.businessType} en ${data.city}, ${data.country}.

USA LA BÚSQUEDA WEB para encontrar salarios actuales del sector en ${data.city}.

## Resumen Ejecutivo
- 3-4 bullets sobre estructura de personal recomendada

## Puestos Esenciales
Lista 5-7 puestos clave:
- Nombre del puesto
- Cantidad necesaria
- Rango salarial mensual

## Salarios en ${data.city}
| Puesto | Salario mensual |
|--------|-----------------|
| Chef/Cocinero principal | $ - $ |
| Cocinero de línea | $ - $ |
| Ayudante de cocina | $ - $ |
| Mesero | $ - $ |
| Cajero | $ - $ |

## Costo Total de Nómina
- Estimado mensual (incluyendo cargas): $ - $

## Próximos Pasos
1. Definir organigrama final
2. Publicar vacantes en plataformas locales
3. Calcular carga patronal exacta

⚠️ Los salarios deben basarse en datos encontrados. Si no hay información específica de ${data.city}, usa referencias nacionales e indícalo.
`,

  marketing_launch: (data) => `
${ANTI_HALLUCINATION_RULES}
${EXECUTIVE_FORMAT_INSTRUCTION}
${getLocationContext(data)}

🎯 TAREA: Estrategia de lanzamiento para ${data.businessType} en ${data.city}.

USA LA BÚSQUEDA WEB para encontrar información sobre plataformas de delivery y marketing en ${data.city}.

## Resumen Ejecutivo
- 3-4 bullets sobre estrategia de lanzamiento

## Plataformas de Delivery
| Plataforma | Disponible en ${data.city} | Comisión |
|------------|---------------------------|----------|

## Estrategia Digital
- Redes prioritarias para ${data.businessType}
- Tipo de contenido recomendado
- Frecuencia sugerida

## Presupuesto de Lanzamiento
| Concepto | Inversión sugerida |
|----------|-------------------|
| Fotografía profesional | $ - $ |
| Publicidad inicial | $ - $ |
| Evento de apertura | $ - $ |

## Próximos Pasos
1. Crear perfiles en redes sociales
2. Registrarse en plataformas de delivery
3. Planificar evento de apertura

⚠️ Solo incluye plataformas confirmadas para ${data.city}. Las comisiones deben ser verificables.
`,

  financial_projection: (data) => `
${ANTI_HALLUCINATION_RULES}
${EXECUTIVE_FORMAT_INSTRUCTION}
${getLocationContext(data)}

🎯 TAREA: Proyección financiera para ${data.businessType} en ${data.city}.
${data.estimatedBudget ? `Inversión estimada: $${data.estimatedBudget.toLocaleString()}` : ''}

USA LA BÚSQUEDA WEB para encontrar benchmarks financieros del sector en ${data.country}.

## Resumen Ejecutivo
- 3-4 bullets sobre viabilidad financiera

## Inversión Inicial
| Concepto | Rango estimado |
|----------|----------------|
| Adecuación local | $ - $ |
| Equipamiento | $ - $ |
| Capital de trabajo | $ - $ |
| Permisos y legal | $ - $ |
| **Total** | **$ - $** |

## Costos Operativos Mensuales
| Concepto | Monto estimado |
|----------|----------------|
| Renta | $ |
| Nómina | $ |
| Insumos (% ventas) | % |
| Servicios | $ |
| **Total fijos** | **$** |

## Métricas Clave
- Food cost objetivo: 28-35%
- Labor cost objetivo: 25-35%
- Punto de equilibrio: $ ventas/mes

## Próximos Pasos
1. Validar costos con cotizaciones reales
2. Definir ticket promedio objetivo
3. Proyectar escenarios (pesimista/optimista)

⚠️ Estos son rangos referenciales. Los números finales dependen de cotizaciones específicas y modelo de negocio.
`
};

// ═══════════════════════════════════════════════════════════════
// CUSTOM ERROR FOR RATE LIMITING
// ═══════════════════════════════════════════════════════════════
class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER: CALL OPENAI API WITH RETRY AND BACKOFF
// ═══════════════════════════════════════════════════════════════
async function callOpenAI(systemPrompt: string, userPrompt: string, projectData: ProjectData): Promise<{ text: string; sources: string[] }> {
  // Migrado a Lovable AI Gateway (Fase 1.1). Web search nativo deshabilitado;
  // si necesitas búsqueda web real, considera añadir un tool de búsqueda en Fase 2.
  const _countryCtx = `${projectData.city}, ${projectData.country}`;
  void _countryCtx;

  const aiResult = await callAIGateway({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    tier: "reasoning",
    maxTokens: 4000,
    maxRetries: 3,
    logPrefix: "[business-opening-assistant]",
  });

  if (!aiResult.ok) {
    if (aiResult.status === 429) {
      throw new RateLimitError(aiResult.error);
    }
    throw new Error(aiResult.error);
  }

  const analysisText = aiResult.content;
  if (!analysisText) throw new Error("La respuesta de la IA está vacía");

  return { text: analysisText, sources: [] as string[] };
}

// ═══════════════════════════════════════════════════════════════
// BACKGROUND JOB PROCESSOR - SELF-CHAINING
// ═══════════════════════════════════════════════════════════════
async function processBackgroundAnalysis(
  supabase: ReturnType<typeof createClient>,
  runId: string,
  projectId: string,
  projectData: ProjectData,
  includeChecklist: boolean
) {
  console.log(`[background-job] Starting processing for run ${runId}`);
  
  const baseSystemPrompt = `Eres un consultor experto en apertura de negocios gastronómicos.

REGLA CRÍTICA: ENTREGA RESULTADOS DIRECTAMENTE. 
- NUNCA preguntes "¿quieres que busque?" - USA la búsqueda automáticamente
- NUNCA expliques lo que vas a hacer - HAZLO directamente
- NUNCA muestres tu proceso de pensamiento
- Si falta información, indica "Verificar en [fuente]" y continúa

USA la búsqueda web para obtener datos ACTUALES y VERIFICABLES.
Responde SIEMPRE en ESPAÑOL, formato MARKDOWN ejecutivo (máximo 1 página).
Cada punto debe ser ACCIONABLE y CONCRETO.`;

  // Get current run status
  const { data: run, error: runError } = await supabase
    .from('opening_analysis_runs')
    .select('*')
    .eq('id', runId)
    .single();
  
  if (runError || !run) {
    console.error('[background-job] Run not found:', runError);
    return;
  }
  
  if (run.status === 'cancelled') {
    console.log('[background-job] Run was cancelled, stopping');
    return;
  }
  
  const completedPhases: string[] = run.phases_completed || [];
  const failedPhases: string[] = run.phases_failed || [];
  
  // Find next phase to process
  const remainingPhases = PHASES.filter(p => !completedPhases.includes(p));
  
  if (remainingPhases.length === 0) {
    // All phases done, generate checklist if needed
    if (includeChecklist && !run.checklist_generated) {
      await processChecklist(supabase, runId, projectId, projectData);
    } else {
      // Mark as completed
      await supabase
        .from('opening_analysis_runs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', runId);
    }
    return;
  }
  
  const currentPhase = remainingPhases[0];
  console.log(`[background-job] Processing phase: ${currentPhase}`);
  
  // Update run status
  await supabase
    .from('opening_analysis_runs')
    .update({
      status: 'processing',
      current_phase: currentPhase,
      started_at: run.started_at || new Date().toISOString(),
    })
    .eq('id', runId);
  
  try {
    // Analyze the phase
    const userPrompt = PHASE_PROMPTS[currentPhase](projectData);
    const { text: analysisText, sources } = await callOpenAI(baseSystemPrompt, userPrompt, projectData);
    
    // Save analysis to database IMMEDIATELY
    await supabase
      .from('opening_phase_analyses')
      .upsert(
        {
          project_id: projectId,
          phase: currentPhase,
          analysis_data: { text: analysisText, structured: null },
          sources,
          status: 'completed',
        },
        { onConflict: 'project_id,phase', ignoreDuplicates: false }
      );
    
    console.log(`[background-job] Phase ${currentPhase} saved successfully`);
    
    // Update run with completed phase
    const newCompleted = [...completedPhases, currentPhase];
    const progress = Math.round((newCompleted.length / PHASES.length) * 100);
    
    await supabase
      .from('opening_analysis_runs')
      .update({
        phases_completed: newCompleted,
        current_phase: remainingPhases.length > 1 ? remainingPhases[1] : null,
      })
      .eq('id', runId);
    
    // Update project progress
    await supabase
      .from('business_opening_projects')
      .update({
        progress_percentage: progress,
        current_phase: currentPhase,
      })
      .eq('id', projectId);
      
  } catch (error) {
    console.error(`[background-job] Error processing phase ${currentPhase}:`, error);
    
    // Mark phase as failed but continue
    await supabase
      .from('opening_analysis_runs')
      .update({
        phases_failed: [...failedPhases, currentPhase],
      })
      .eq('id', runId);
  }
  
  // Check if cancelled before continuing
  const { data: checkRun } = await supabase
    .from('opening_analysis_runs')
    .select('status')
    .eq('id', runId)
    .single();
  
  if (checkRun?.status === 'cancelled') {
    console.log('[background-job] Run cancelled during processing');
    return;
  }
  
  // Self-chain: trigger next phase
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
  
  // Fire-and-forget the next invocation
  fetch(`${SUPABASE_URL}/functions/v1/business-opening-assistant`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'continue_analysis',
      runId,
      projectId,
      projectData,
    }),
  }).catch(err => console.error('[background-job] Self-chain failed:', err));
}

// ═══════════════════════════════════════════════════════════════
// CHECKLIST PROCESSOR
// ═══════════════════════════════════════════════════════════════
async function processChecklist(
  supabase: ReturnType<typeof createClient>,
  runId: string,
  projectId: string,
  projectData: ProjectData
) {
  console.log(`[background-job] Generating checklist for run ${runId}`);
  
  const checklistSystemPrompt = `Eres un experto consultor en apertura de negocios gastronómicos.
Genera un checklist estructurado y realista.

${ANTI_HALLUCINATION_RULES}

REGLAS:
1. Responde ÚNICAMENTE con un objeto JSON válido
2. El JSON debe seguir EXACTAMENTE el esquema solicitado
3. Máximo 25-30 tareas (calidad sobre cantidad)
4. Cada tarea debe ser ESPECÍFICA y ACCIONABLE`;

  const checklistPrompt = `
${getLocationContext(projectData)}

Genera un checklist para abrir un ${projectData.businessType}${projectData.cuisineType ? ` de cocina ${projectData.cuisineType}` : ''}.

REGLAS:
1. Cada tarea ÚNICA y ESPECÍFICA - NO repitas conceptos
2. Máximo 25-30 tareas total
3. Tareas ACCIONABLES, no genéricas

Fases:
- planning, legal, location, equipment, suppliers, staffing, marketing, pre_opening, opening

Responde ÚNICAMENTE en JSON:
{
  "items": [
    { "phase": "planning", "title": "Título", "description": "Descripción", "sortOrder": 1 }
  ]
}
`;

  try {
    const { text: analysisText } = await callOpenAI(checklistSystemPrompt, checklistPrompt, projectData);
    
    if (detectTruncation(analysisText)) {
      throw new Error('Checklist truncado');
    }
    
    const parsed = extractJsonFromResponse(analysisText) as { items?: unknown[] };
    if (!parsed?.items || !Array.isArray(parsed.items) || parsed.items.length === 0) {
      throw new Error('Checklist vacío');
    }
    
    // Deduplicate
    const seenTitles = new Set<string>();
    const uniqueItems = parsed.items.filter((item: any) => {
      const normalized = item.title?.toLowerCase().trim();
      if (seenTitles.has(normalized)) return false;
      seenTitles.add(normalized);
      return true;
    });
    
    // Delete old checklist
    await supabase
      .from('opening_checklist_items')
      .delete()
      .eq('project_id', projectId);
    
    // Insert new
    const checklistItems = uniqueItems.map((item: any, index: number) => ({
      project_id: projectId,
      phase: item.phase || 'planning',
      title: item.title,
      description: item.description,
      sort_order: item.sortOrder || index,
    }));
    
    await supabase
      .from('opening_checklist_items')
      .insert(checklistItems);
    
    console.log(`[background-job] Checklist saved with ${checklistItems.length} items`);
    
    // Mark run as completed
    await supabase
      .from('opening_analysis_runs')
      .update({
        status: 'completed',
        checklist_generated: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);
      
  } catch (error) {
    console.error('[background-job] Checklist error:', error);
    
    // Still mark as completed (phases done)
    await supabase
      .from('opening_analysis_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        error_message: `Checklist error: ${(error as Error).message}`,
      })
      .eq('id', runId);
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: BusinessOpeningRequest = await req.json();
    const { action, projectData, phase, question, runId, projectId } = body;
    
    console.log(`[business-opening-assistant] Action: ${action}`);
    
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // ═══════════════════════════════════════════════════════════════
    // START FULL ANALYSIS - Creates a run and starts background job
    // ═══════════════════════════════════════════════════════════════
    if (action === 'start_full_analysis') {
      if (!projectId) throw new Error('projectId required');
      
      // Check for existing incomplete run
      const { data: existingRun } = await supabase
        .from('opening_analysis_runs')
        .select('*')
        .eq('project_id', projectId)
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (existingRun) {
        // Resume existing run
        console.log(`[business-opening-assistant] Resuming existing run ${existingRun.id}`);
        
        // Trigger continuation
        EdgeRuntime.waitUntil(
          processBackgroundAnalysis(supabase, existingRun.id, projectId, projectData, existingRun.include_checklist)
        );
        
        return new Response(
          JSON.stringify({
            success: true,
            runId: existingRun.id,
            status: 'resumed',
            phases_completed: existingRun.phases_completed,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Get user from project
      const { data: project } = await supabase
        .from('business_opening_projects')
        .select('user_id')
        .eq('id', projectId)
        .single();
      
      if (!project) throw new Error('Project not found');
      
      // Create new run
      const { data: newRun, error: createError } = await supabase
        .from('opening_analysis_runs')
        .insert({
          project_id: projectId,
          user_id: project.user_id,
          status: 'pending',
          include_checklist: true,
        })
        .select()
        .single();
      
      if (createError) throw createError;
      
      console.log(`[business-opening-assistant] Created new run ${newRun.id}`);
      
      // Start background processing
      EdgeRuntime.waitUntil(
        processBackgroundAnalysis(supabase, newRun.id, projectId, projectData, true)
      );
      
      return new Response(
        JSON.stringify({
          success: true,
          runId: newRun.id,
          status: 'started',
          message: 'Análisis iniciado en background',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // ═══════════════════════════════════════════════════════════════
    // CONTINUE ANALYSIS - Self-chaining endpoint
    // ═══════════════════════════════════════════════════════════════
    if (action === 'continue_analysis') {
      if (!runId || !projectId) throw new Error('runId and projectId required');
      
      EdgeRuntime.waitUntil(
        processBackgroundAnalysis(supabase, runId, projectId, projectData, true)
      );
      
      return new Response(
        JSON.stringify({ success: true, status: 'continuing' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // ═══════════════════════════════════════════════════════════════
    // LEGACY: SINGLE PHASE ANALYSIS (for manual retry)
    // ═══════════════════════════════════════════════════════════════
    if (action === 'analyze_phase' && phase && PHASE_PROMPTS[phase]) {
      const baseSystemPrompt = `Eres un consultor experto en apertura de negocios gastronómicos.

REGLA CRÍTICA: ENTREGA RESULTADOS DIRECTAMENTE. 
- NUNCA preguntes "¿quieres que busque?" - USA la búsqueda automáticamente
- NUNCA expliques lo que vas a hacer - HAZLO directamente
- NUNCA muestres tu proceso de pensamiento
- Si falta información, indica "Verificar en [fuente]" y continúa

USA la búsqueda web para obtener datos ACTUALES y VERIFICABLES.
Responde SIEMPRE en ESPAÑOL, formato MARKDOWN ejecutivo (máximo 1 página).
Cada punto debe ser ACCIONABLE y CONCRETO.`;

      const userPrompt = PHASE_PROMPTS[phase](projectData);
      const { text: analysisText, sources } = await callOpenAI(baseSystemPrompt, userPrompt, projectData);
      
      return new Response(
        JSON.stringify({
          success: true,
          action,
          phase,
          analysis: analysisText,
          sources,
          timestamp: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // ═══════════════════════════════════════════════════════════════
    // ASK QUESTION
    // ═══════════════════════════════════════════════════════════════
    if (action === 'ask_question' && question) {
      const baseSystemPrompt = `Eres un consultor experto en apertura de negocios gastronómicos.
USA la búsqueda web para obtener datos ACTUALES.
Responde de forma CONCRETA y EJECUTIVA en ESPAÑOL.`;

      const userPrompt = `
${ANTI_HALLUCINATION_RULES}
${EXECUTIVE_FORMAT_INSTRUCTION}
${getLocationContext(projectData)}

**PREGUNTA DEL USUARIO:** ${question}

Responde de forma concisa y ejecutiva. USA LA BÚSQUEDA WEB para información actual de ${projectData.city}.
`;
      
      const { text: analysisText, sources } = await callOpenAI(baseSystemPrompt, userPrompt, projectData);
      
      return new Response(
        JSON.stringify({
          success: true,
          action,
          analysis: analysisText,
          sources,
          timestamp: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // ═══════════════════════════════════════════════════════════════
    // GENERATE CHECKLIST (standalone)
    // ═══════════════════════════════════════════════════════════════
    if (action === 'generate_checklist') {
      const checklistSystemPrompt = `Eres un experto consultor en apertura de negocios gastronómicos.
Genera un checklist estructurado y realista.

${ANTI_HALLUCINATION_RULES}

REGLAS:
1. Responde ÚNICAMENTE con un objeto JSON válido
2. El JSON debe seguir EXACTAMENTE el esquema solicitado
3. Máximo 25-30 tareas (calidad sobre cantidad)
4. Cada tarea debe ser ESPECÍFICA y ACCIONABLE`;

      const checklistPrompt = `
${getLocationContext(projectData)}

Genera un checklist para abrir un ${projectData.businessType}${projectData.cuisineType ? ` de cocina ${projectData.cuisineType}` : ''}.

REGLAS:
1. Cada tarea ÚNICA y ESPECÍFICA - NO repitas conceptos
2. Máximo 25-30 tareas total
3. Tareas ACCIONABLES, no genéricas

Fases:
- planning, legal, location, equipment, suppliers, staffing, marketing, pre_opening, opening

Responde ÚNICAMENTE en JSON:
{
  "items": [
    { "phase": "planning", "title": "Título", "description": "Descripción", "sortOrder": 1 }
  ]
}
`;
      
      const { text: analysisText, sources } = await callOpenAI(checklistSystemPrompt, checklistPrompt, projectData);
      
      if (detectTruncation(analysisText)) {
        throw new Error('La respuesta del checklist parece truncada. Intenta nuevamente.');
      }
      
      const parsed = extractJsonFromResponse(analysisText);
      
      return new Response(
        JSON.stringify({
          success: true,
          action,
          analysis: analysisText,
          structured_data: parsed,
          sources,
          timestamp: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    throw new Error('Invalid action or missing parameters');

  } catch (error) {
    console.error('[business-opening-assistant] Error:', error);
    
    // Return appropriate status code based on error type
    const isRateLimit = error instanceof RateLimitError || 
      (error instanceof Error && error.message.toLowerCase().includes('rate limit'));
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        retryable: isRateLimit,
      }),
      { 
        status: isRateLimit ? 429 : 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
