import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ═══════════════════════════════════════════════════════════════
// COUNTRY CODE MAPPING FOR USER_LOCATION
// ═══════════════════════════════════════════════════════════════
const COUNTRY_CODES: Record<string, string> = {
  'México': 'MX',
  'Mexico': 'MX',
  'Colombia': 'CO',
  'Argentina': 'AR',
  'Chile': 'CL',
  'Perú': 'PE',
  'Peru': 'PE',
  'Ecuador': 'EC',
  'España': 'ES',
  'Spain': 'ES',
  'Estados Unidos': 'US',
  'United States': 'US',
  'Guatemala': 'GT',
  'Costa Rica': 'CR',
  'Panamá': 'PA',
  'Panama': 'PA',
  'Uruguay': 'UY',
  'Paraguay': 'PY',
  'Bolivia': 'BO',
  'Venezuela': 'VE',
  'Honduras': 'HN',
  'El Salvador': 'SV',
  'Nicaragua': 'NI',
  'República Dominicana': 'DO',
  'Dominican Republic': 'DO',
  'Puerto Rico': 'PR',
  'Cuba': 'CU',
};

const getCountryCode = (country: string): string => {
  return COUNTRY_CODES[country] || 'MX';
};

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

// ═══════════════════════════════════════════════════════════════
// EXECUTIVE FORMAT INSTRUCTION
// ═══════════════════════════════════════════════════════════════
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
  let cleaned = responseText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    throw new Error('No se encontró un objeto JSON en la respuesta.');
  }

  cleaned = cleaned.substring(jsonStart, jsonEnd + 1);

  try {
    return JSON.parse(cleaned);
  } catch (_e) {
    const fixed = cleaned
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/[\x00-\x1F\x7F]/g, '');
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

interface BusinessOpeningRequest {
  action: 'analyze_phase' | 'ask_question' | 'generate_checklist';
  projectData: {
    projectName: string;
    businessType: string;
    cuisineType?: string;
    description?: string;
    city: string;
    country: string;
    neighborhood?: string;
    estimatedBudget?: number;
  };
  phase?: string;
  question?: string;
}

// Helper to create strong location context
const getLocationContext = (data: BusinessOpeningRequest['projectData']) => `
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
const PHASE_PROMPTS: Record<string, (data: BusinessOpeningRequest['projectData']) => string> = {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, projectData, phase, question }: BusinessOpeningRequest = await req.json();

    console.log(`[business-opening-assistant] Processing ${action} for ${projectData.businessType} in ${projectData.city}, ${projectData.country}`);

    // ═══════════════════════════════════════════════════════════════
    // SYSTEM PROMPTS - DIRECT ACTION, NO QUESTIONS
    // ═══════════════════════════════════════════════════════════════
    const baseSystemPrompt = `Eres un consultor experto en apertura de negocios gastronómicos.

REGLA CRÍTICA: ENTREGA RESULTADOS DIRECTAMENTE. 
- NUNCA preguntes "¿quieres que busque?" - USA la búsqueda automáticamente
- NUNCA expliques lo que vas a hacer - HAZLO directamente
- NUNCA muestres tu proceso de pensamiento
- Si falta información, indica "Verificar en [fuente]" y continúa

USA la búsqueda web para obtener datos ACTUALES y VERIFICABLES.
Responde SIEMPRE en ESPAÑOL, formato MARKDOWN ejecutivo (máximo 1 página).
Cada punto debe ser ACCIONABLE y CONCRETO.`;

    const checklistSystemPrompt = `Eres un experto consultor en apertura de negocios gastronómicos.
Genera un checklist estructurado y realista.

${ANTI_HALLUCINATION_RULES}

REGLAS:
1. Responde ÚNICAMENTE con un objeto JSON válido
2. El JSON debe seguir EXACTAMENTE el esquema solicitado
3. Máximo 25-30 tareas (calidad sobre cantidad)
4. Cada tarea debe ser ESPECÍFICA y ACCIONABLE`;

    const systemPrompt = action === 'generate_checklist' ? checklistSystemPrompt : baseSystemPrompt;

    let userPrompt = '';

    if (action === 'analyze_phase' && phase && PHASE_PROMPTS[phase]) {
      userPrompt = PHASE_PROMPTS[phase](projectData);
    } else if (action === 'ask_question' && question) {
      userPrompt = `
${ANTI_HALLUCINATION_RULES}
${EXECUTIVE_FORMAT_INSTRUCTION}
${getLocationContext(projectData)}

**PREGUNTA DEL USUARIO:** ${question}

Responde de forma concisa y ejecutiva. USA LA BÚSQUEDA WEB para información actual de ${projectData.city}.
`;
    } else if (action === 'generate_checklist') {
      userPrompt = `
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
    {
      "phase": "planning",
      "title": "Título claro y específico",
      "description": "Descripción breve",
      "sortOrder": 1
    }
  ]
}
`;
    } else {
      throw new Error('Invalid action or missing parameters');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // ═══════════════════════════════════════════════════════════════
    // OPENAI RESPONSES API WITH GPT-5.2 + WEB SEARCH
    // ═══════════════════════════════════════════════════════════════
    const countryCode = getCountryCode(projectData.country);
    
    console.log(`[business-opening-assistant] Using model gpt-5.2 with web_search for ${projectData.city}, ${countryCode}`);

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5.2',
        tools: [{
          type: 'web_search',
          search_context_size: 'high',
          user_location: {
            type: 'approximate',
            country: countryCode,
            city: projectData.city,
            region: projectData.neighborhood || projectData.city
          }
        }],
        reasoning: { effort: 'medium' },
        input: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[business-opening-assistant] OpenAI API error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (response.status === 401) {
        throw new Error('Invalid OpenAI API key.');
      }
      
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[business-opening-assistant] OpenAI Response received, extracting content...');
    
    // ═══════════════════════════════════════════════════════════════
    // EXTRACT RESPONSE TEXT AND SOURCES
    // ═══════════════════════════════════════════════════════════════
    let analysisText = '';
    let sources: string[] = [];
    
    if (data.output) {
      for (const item of data.output) {
        // Extract main text content
        if (item.type === 'message' && item.content) {
          for (const content of item.content) {
            if (content.type === 'output_text') {
              analysisText = content.text;
              
              // Extract URL citations from annotations
              if (content.annotations) {
                const annotationUrls = content.annotations
                  .filter((a: { type: string; url?: string }) => a.type === 'url_citation' && a.url)
                  .map((a: { url: string }) => a.url);
                sources = [...sources, ...annotationUrls];
              }
            }
          }
        }
        
        // Extract sources from web_search_call
        if (item.type === 'web_search_call') {
          console.log('[business-opening-assistant] Web search performed:', item.id);
          
          if (item.action?.sources) {
            const searchSources = item.action.sources
              .filter((s: { url?: string }) => s.url && !s.url.includes('oai-'))
              .map((s: { url: string }) => s.url);
            sources = [...sources, ...searchSources];
          }
        }
      }
    }
    
    // Remove duplicate sources
    sources = [...new Set(sources)];
    
    console.log(`[business-opening-assistant] Extracted ${analysisText.length} chars, ${sources.length} sources`);
    
    if (!analysisText) {
      console.error('[business-opening-assistant] No content in OpenAI response:', JSON.stringify(data).substring(0, 500));
      throw new Error('OpenAI response was empty');
    }

    // Parse JSON for checklist action
    let structuredData = null;
    if (action === 'generate_checklist') {
      try {
        if (detectTruncation(analysisText)) {
          throw new Error('La respuesta del checklist parece truncada. Intenta nuevamente.');
        }

        const parsed = extractJsonFromResponse(analysisText);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Checklist: JSON inválido');
        }

        const obj = parsed as Record<string, unknown>;
        const items = obj.items;
        if (!Array.isArray(items) || items.length === 0) {
          throw new Error('Checklist: JSON sin items');
        }

        structuredData = parsed;
      } catch (e) {
        console.log('[business-opening-assistant] Could not parse JSON from checklist:', (e as Error)?.message ?? String(e));
        throw e;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        action,
        phase,
        analysis: analysisText,
        structured_data: structuredData,
        sources,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[business-opening-assistant] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
