import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function extractJsonFromResponse(responseText: string): unknown {
  // Remove markdown fences
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
    // Try to fix common issues (trailing commas, control chars)
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
═══════════════════════════════════════════════════════════════
📍 CONTEXTO GEOGRÁFICO OBLIGATORIO - LEE ESTO PRIMERO
═══════════════════════════════════════════════════════════════
Ciudad: ${data.city}
País: ${data.country}
${data.neighborhood ? `Zona/Barrio: ${data.neighborhood}` : 'Zona: Por definir'}

Tipo de negocio: ${data.businessType}
${data.cuisineType ? `Tipo de cocina: ${data.cuisineType}` : ''}
${data.description ? `
📝 DESCRIPCIÓN DEL CONCEPTO (MUY IMPORTANTE - USA ESTA INFORMACIÓN):
${data.description}
` : ''}

⚠️ REGLA CRÍTICA: TODA la información DEBE ser ESPECÍFICA para ${data.city}, ${data.country}.
- NO proporciones información genérica del país
- Busca datos LOCALES de ${data.city}
- Menciona direcciones, zonas y referencias de ${data.city}
- Usa precios y costos del mercado de ${data.city}
${data.neighborhood ? `- Enfócate especialmente en la zona de ${data.neighborhood}` : ''}
${data.description ? `- ADAPTA tus recomendaciones al concepto descrito por el usuario` : ''}
═══════════════════════════════════════════════════════════════
`;

const PHASE_PROMPTS: Record<string, (data: BusinessOpeningRequest['projectData']) => string> = {
  legal_requirements: (data) => `
${getLocationContext(data)}

🎯 TAREA: Requisitos legales ESPECÍFICOS para abrir un ${data.businessType} ${data.cuisineType ? `de cocina ${data.cuisineType}` : ''} en ${data.city}, ${data.country}.

Busca información ACTUAL y REAL. Responde en MARKDOWN legible, NO en JSON.

## 1. Permisos Municipales de ${data.city}
- Licencia de funcionamiento municipal de ${data.city}
- Costo aproximado y tiempo de trámite
- Oficina/dependencia donde se tramita (con dirección en ${data.city})
- Certificado de uso de suelo
- Dictamen de protección civil

## 2. Requisitos Sanitarios Locales
${data.country === 'México' ? `- Aviso de funcionamiento COFEPRIS (delegación en ${data.city})` : '- Requisitos sanitarios locales'}
- Licencia sanitaria estatal/municipal
- Análisis de agua
- Control de plagas certificado
- Cursos de manejo de alimentos

## 3. Registro Fiscal
${data.country === 'México' ? '- RFC y obligaciones SAT' : '- Registro tributario local'}
- Requisitos de facturación electrónica
- Oficina local para trámites

## 4. Licencia de Bebidas Alcohólicas (si aplica en ${data.city})
- Tipos de licencias disponibles en el estado/municipio
- Costos y requisitos específicos
- Restricciones de horario en ${data.city}

## 5. Otros Requisitos
- Seguros obligatorios
- Registro de marca
- Alta patronal

Para cada trámite incluye:
✅ Costo aproximado actual
✅ Tiempo estimado de obtención  
✅ Documentos necesarios
✅ Dirección/contacto de la dependencia en ${data.city}
`,

  location_analysis: (data) => `
${getLocationContext(data)}

🎯 TAREA: Análisis de ubicación para abrir un ${data.businessType} ${data.cuisineType ? `de cocina ${data.cuisineType}` : ''} en ${data.city}, ${data.country}.
${data.neighborhood ? `El cliente tiene interés en la zona de ${data.neighborhood}.` : ''}

Responde en MARKDOWN legible, NO en JSON.

## 1. Mejores Zonas en ${data.city} para este Negocio
Recomienda las **5 mejores colonias/zonas** de ${data.city} para un ${data.businessType}:

Para cada zona incluye:
- Nombre de la colonia/zona
- Por qué es buena para este tipo de negocio
- Perfil del público que frecuenta esa zona
- Nivel de competencia
${data.neighborhood ? `\n### Análisis especial de ${data.neighborhood}\nIncluye un análisis detallado de esta zona específica.` : ''}

## 2. Costos de Renta en ${data.city}
- Precio promedio por m² en cada zona recomendada
- Rango para locales de 50-150 m²
- Tendencia actual del mercado inmobiliario en ${data.city}

## 3. Competencia Local
- Restaurantes similares exitosos en ${data.city} (nombres reales)
- Densidad de competencia por zona
- Oportunidades de diferenciación

## 4. Factores de Éxito por Zona
- Flujo peatonal
- Estacionamiento
- Transporte público cercano
- Negocios complementarios

## 5. Uso de Suelo
- Zonas con uso comercial permitido en ${data.city}
- Restricciones específicas del municipio

${data.estimatedBudget ? `\n💰 Presupuesto del cliente: $${data.estimatedBudget.toLocaleString()} MXN - ajusta las recomendaciones a este presupuesto.` : ''}
`,

  equipment_setup: (data) => `
${getLocationContext(data)}

🎯 TAREA: Equipamiento necesario para un ${data.businessType} ${data.cuisineType ? `de cocina ${data.cuisineType}` : ''} en ${data.city}, ${data.country}.

Responde en MARKDOWN legible, NO en JSON.

## 1. Equipo de Cocina Esencial
Lista detallada con precios del mercado de ${data.city}:
- Estufas industriales
- Refrigeradores/congeladores comerciales
- Campanas de extracción
- Mesas de trabajo
- Equipo específico para ${data.cuisineType || 'cocina general'}

## 2. Equipo de Servicio
- Mobiliario (mesas, sillas)
- Cristalería, loza, cubiertos
- Sistema POS
- Decoración

## 3. Proveedores de Equipo en ${data.city}
Lista proveedores REALES con:
- **Nombre del proveedor**
- Dirección en ${data.city}
- Teléfono/contacto
- Especialidad (nuevo/usado)
- Rango de precios

## 4. Opciones de Compra
- Equipo nuevo vs usado
- Financiamiento disponible
- Arrendamiento de equipo

## 5. Presupuesto de Equipamiento
| Categoría | Inversión Mínima | Inversión Recomendada |
|-----------|------------------|----------------------|
| Cocina | $ | $ |
| Servicio | $ | $ |
| Otros | $ | $ |
| **Total** | **$** | **$** |

${data.estimatedBudget ? `\n💰 Presupuesto total del cliente: $${data.estimatedBudget.toLocaleString()} MXN` : ''}
`,

  supplier_network: (data) => `
${getLocationContext(data)}

🎯 TAREA: Red de proveedores para un ${data.businessType} ${data.cuisineType ? `de cocina ${data.cuisineType}` : ''} en ${data.city}, ${data.country}.

Responde en MARKDOWN legible, NO en JSON. Incluye NOMBRES y DIRECCIONES REALES de ${data.city}.

## 1. Centrales de Abasto y Mercados Mayoristas en ${data.city}
Para cada uno incluye:
- Nombre del mercado/central
- Dirección completa en ${data.city}
- Días y horarios de operación
- Productos principales

## 2. Distribuidores de Alimentos en ${data.city}
### Carnes
- Nombre del proveedor, dirección, teléfono
- Si tiene certificación TIF

### Mariscos
- Proveedores locales con dirección

### Frutas y Verduras
- Proveedores mayoristas en ${data.city}

### Lácteos
- Distribuidores locales

### Abarrotes y Secos
- Mayoristas en la zona

## 3. Proveedores Especializados para ${data.cuisineType || 'cocina general'}
- Ingredientes especiales
- Importadores en ${data.city}

## 4. Servicios de Entrega
- Proveedores que entregan a domicilio en ${data.city}
- Frecuencia de entregas

## 5. Comparativa de Precios Promedio en ${data.city}
| Producto | Precio Mayoreo | Precio Menudeo |
|----------|----------------|----------------|
| ... | $ | $ |

## 6. Insumos No Alimentarios
- Desechables
- Productos de limpieza
- Uniformes
- Proveedores en ${data.city}
`,

  staffing_plan: (data) => `
${getLocationContext(data)}

🎯 TAREA: Plan de personal para un ${data.businessType} ${data.cuisineType ? `de cocina ${data.cuisineType}` : ''} en ${data.city}, ${data.country}.

Responde en MARKDOWN legible, NO en JSON. Usa datos del mercado laboral de ${data.city}.

## 1. Organigrama Recomendado
(Incluye un diagrama de organigrama con los puestos del equipo)
- Puestos necesarios
- Cantidad por turno
- Estructura de mandos

## 2. Salarios Promedio en ${data.city}
| Puesto | Salario Mensual | Salario Semanal |
|--------|-----------------|-----------------|
| Chef ejecutivo | $ | $ |
| Cocinero de línea | $ | $ |
| Ayudante de cocina | $ | $ |
| Mesero | $ | $ |
| Cajero/Hostess | $ | $ |
| Personal de limpieza | $ | $ |
| Gerente | $ | $ |

*Salarios basados en el mercado actual de ${data.city}*

## 3. Dónde Reclutar en ${data.city}
- Plataformas de empleo que funcionan en ${data.city}
- Escuelas de gastronomía locales (nombres y direcciones)
- Grupos de Facebook/WhatsApp del sector en ${data.city}
- Bolsas de trabajo especializadas

## 4. Requisitos Laborales en ${data.country}
- Alta en seguro social
- Contratos recomendados
- Prestaciones de ley
- Costo patronal (% sobre salario)

## 5. Capacitación
- Cursos obligatorios (manejo de alimentos)
- Dónde tomarlos en ${data.city}
- Costos aproximados

## 6. Turnos y Horarios Típicos
- Estructura de turnos
- Consideraciones legales
`,

  marketing_launch: (data) => `
${getLocationContext(data)}

🎯 TAREA: Estrategia de lanzamiento para un ${data.businessType} ${data.cuisineType ? `de cocina ${data.cuisineType}` : ''} en ${data.city}, ${data.country}.

Responde en MARKDOWN legible, NO en JSON.

## 1. Pre-apertura (4-6 semanas antes)
- Estrategia de expectativa en redes
- Creación de perfiles sociales
- Contenido teaser

## 2. Plataformas de Delivery Activas en ${data.city}
| Plataforma | Comisión | Disponible en ${data.city} |
|------------|----------|---------------------------|
| Uber Eats | % | Sí/No |
| Rappi | % | Sí/No |
| DiDi Food | % | Sí/No |

- Proceso de alta en cada plataforma
- Cuál recomiendas para ${data.city}

## 3. Marketing Digital Local
### Agencias de Marketing Gastronómico en ${data.city}
- Nombre, contacto, rango de precios

### Food Bloggers e Influencers de ${data.city}
- Nombres de influencers locales relevantes
- Número de seguidores
- Tipo de colaboraciones

### Fotógrafos de Alimentos en ${data.city}
- Recomendaciones con contacto

## 4. Estrategia de Redes Sociales
- Instagram: tipo de contenido, frecuencia
- TikTok: tendencias locales
- Facebook: grupos relevantes de ${data.city}

## 5. Evento de Inauguración
- Ideas para soft opening
- Gran apertura
- Promociones de lanzamiento efectivas

## 6. Alianzas Estratégicas en ${data.city}
- Colaboraciones con negocios locales
- Convenios corporativos con empresas de la zona
- Programas de lealtad

${data.estimatedBudget ? `\n💰 Presupuesto de marketing sugerido (5-10%): $${(data.estimatedBudget * 0.05).toLocaleString()} - $${(data.estimatedBudget * 0.1).toLocaleString()} MXN` : ''}
`,

  financial_projection: (data) => `
${getLocationContext(data)}

🎯 TAREA: Proyección financiera para un ${data.businessType} ${data.cuisineType ? `de cocina ${data.cuisineType}` : ''} en ${data.city}, ${data.country}.

${data.estimatedBudget ? `💰 Inversión inicial estimada por el cliente: $${data.estimatedBudget.toLocaleString()} MXN` : ''}

Responde en MARKDOWN legible con tablas claras, NO en JSON. Usa costos reales del mercado de ${data.city}.

## 1. Inversión Inicial Detallada
| Concepto | Monto Estimado |
|----------|----------------|
| Adecuación del local | $ |
| Equipamiento | $ |
| Inventario inicial | $ |
| Capital de trabajo (3-6 meses) | $ |
| Permisos y licencias | $ |
| Marketing de lanzamiento | $ |
| Contingencias (10-15%) | $ |
| **TOTAL** | **$** |

## 2. Costos Fijos Mensuales en ${data.city}
| Concepto | Monto Mensual |
|----------|---------------|
| Renta (basado en zonas de ${data.city}) | $ |
| Nómina y cargas sociales | $ |
| Servicios (luz, agua, gas, internet) | $ |
| Software/sistemas | $ |
| Seguros | $ |
| Mantenimiento | $ |
| **TOTAL FIJOS** | **$** |

## 3. Costos Variables (% sobre ventas)
- Costo de alimentos: XX%
- Comisiones delivery: XX%
- Insumos desechables: XX%

## 4. Proyección de Ingresos
- Ticket promedio esperado: $
- Capacidad del local: XX personas
- Rotación de mesas esperada: X veces/día
- Ingreso diario proyectado: $
- Ingreso mensual proyectado: $

## 5. Métricas Clave para ${data.country}
- Food cost objetivo: XX%
- Labor cost objetivo: XX%
- Margen de utilidad típico: XX%

## 6. Punto de Equilibrio
- Ventas mensuales necesarias: $
- Comensales por día: XX

## 7. Retorno de Inversión
- ROI estimado: XX%
- Periodo de recuperación: XX meses

---
*Proyección basada en el mercado actual de ${data.city}, ${data.country}*
`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, projectData, phase, question }: BusinessOpeningRequest = await req.json();

    const baseSystemPrompt = `Eres un experto consultor en apertura de negocios gastronómicos en Latinoamérica.
Tienes acceso a información actualizada a través de búsqueda web.

REGLAS CRÍTICAS:
1. SIEMPRE responde en ESPAÑOL
2. SIEMPRE responde en formato MARKDOWN legible, con encabezados (##), listas (-), y tablas (|)
3. SIEMPRE incluye información ESPECÍFICA de la ciudad mencionada, no del país en general
4. Incluye nombres reales de negocios, direcciones y precios cuando sea posible
5. Sé práctico y accionable, no teórico

Tu respuesta debe ser fácil de leer y aplicar inmediatamente.`;

    const checklistSystemPrompt = `Eres un experto consultor en apertura de negocios gastronómicos.
Debes generar un checklist estructurado.

REGLAS CRÍTICAS:
1. Responde ÚNICAMENTE con un objeto JSON válido (sin markdown, sin texto extra)
2. El JSON debe seguir EXACTAMENTE el esquema solicitado
3. No incluyas comentarios ni trailing commas
4. El contenido debe ser ESPECÍFICO de la ciudad y el tipo de negocio`;

    const systemPrompt = action === 'generate_checklist' ? checklistSystemPrompt : baseSystemPrompt;

    let userPrompt = '';

    if (action === 'analyze_phase' && phase && PHASE_PROMPTS[phase]) {
      userPrompt = PHASE_PROMPTS[phase](projectData);
    } else if (action === 'ask_question' && question) {
      userPrompt = `
${getLocationContext(projectData)}

El usuario está planeando abrir un ${projectData.businessType} ${projectData.cuisineType ? `de cocina ${projectData.cuisineType}` : ''}.
${projectData.estimatedBudget ? `Su presupuesto estimado es de $${projectData.estimatedBudget.toLocaleString()} MXN.` : ''}

**PREGUNTA DEL USUARIO:** ${question}

Responde en MARKDOWN legible. Busca información ACTUAL y ESPECÍFICA de ${projectData.city}, ${projectData.country}.
`;
    } else if (action === 'generate_checklist') {
      userPrompt = `
${getLocationContext(projectData)}

Genera un checklist para abrir un ${projectData.businessType} ${projectData.cuisineType ? `de cocina ${projectData.cuisineType}` : ''}.

REGLAS IMPORTANTES:
1. Cada tarea debe ser ÚNICA y ESPECÍFICA - NO repitas conceptos similares
2. Máximo 25-30 tareas en total (calidad sobre cantidad)
3. Las tareas deben ser ACCIONABLES, no genéricas
4. Incluye referencias a ${projectData.city} cuando sea relevante

Organiza por fases:
- planning (Planeación)
- legal (Legal y Permisos)
- location (Ubicación)
- equipment (Equipamiento)
- suppliers (Proveedores)
- staffing (Personal)
- marketing (Marketing)
- pre_opening (Pre-apertura)
- opening (Apertura)

Responde ÚNICAMENTE en este formato JSON (sin texto adicional):
{
  "items": [
    {
      "phase": "planning",
      "title": "Título claro y específico",
      "description": "Descripción breve de qué hacer",
      "sortOrder": 1
    }
  ]
}

IMPORTANTE: No incluyas tareas duplicadas o muy similares. Cada tarea debe aportar valor único.
`;
    } else {
      throw new Error('Invalid action or missing parameters');
    }

    console.log(`Processing ${action} for ${projectData.businessType} in ${projectData.city}, ${projectData.country}`);

    // Use OpenAI Responses API with web search capability
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-nano',
        tools: [{ type: 'web_search_preview' }],
        reasoning: { effort: 'low' },
        input: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (response.status === 401) {
        throw new Error('Invalid OpenAI API key.');
      }
      
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI Response received:', JSON.stringify(data).substring(0, 300));
    
    // Extract the text response from Responses API format
    let analysisText = '';
    let sources: string[] = [];
    
    if (data.output) {
      for (const item of data.output) {
        if (item.type === 'message' && item.content) {
          for (const content of item.content) {
            if (content.type === 'output_text') {
              analysisText = content.text;
            }
          }
        }
        // Extract web search sources if available
        if (item.type === 'web_search_call') {
          console.log('Web search performed:', item.id);
        }
      }
    }
    
    if (!analysisText) {
      console.error('No content in OpenAI response:', JSON.stringify(data));
      throw new Error('OpenAI response was empty');
    }

    // Try to parse JSON from the response (only for checklist action)
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
        console.log('Could not parse JSON from checklist response:', (e as Error)?.message ?? String(e));
        // Return a failure so the frontend doesn't silently accept an empty checklist
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
    console.error('Error in business-opening-assistant:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
