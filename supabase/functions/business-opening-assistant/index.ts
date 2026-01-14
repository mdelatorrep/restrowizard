import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BusinessOpeningRequest {
  action: 'analyze_phase' | 'ask_question' | 'generate_checklist';
  projectData: {
    projectName: string;
    businessType: string;
    cuisineType?: string;
    city: string;
    country: string;
    neighborhood?: string;
    estimatedBudget?: number;
  };
  phase?: string;
  question?: string;
}

const PHASE_PROMPTS: Record<string, (data: BusinessOpeningRequest['projectData']) => string> = {
  legal_requirements: (data) => `
Busca los requisitos legales ACTUALES y ESPECÍFICOS para abrir un ${data.businessType} ${data.cuisineType ? `de cocina ${data.cuisineType}` : ''} en ${data.city}, ${data.country}.

IMPORTANTE: Proporciona información REAL y ACTUALIZADA basada en búsquedas web.

Incluye con DETALLE:
1. **Permisos Municipales**
   - Licencia de funcionamiento (costo aproximado, tiempo de trámite)
   - Certificado de uso de suelo compatible
   - Dictamen de protección civil
   
2. **Requisitos Sanitarios**
   - ${data.country === 'México' ? 'Aviso de funcionamiento COFEPRIS' : 'Requisitos sanitarios locales'}
   - Licencia sanitaria
   - Análisis de agua
   - Control de plagas certificado
   
3. **Registro Fiscal**
   - ${data.country === 'México' ? 'RFC y obligaciones SAT' : 'Registro tributario local'}
   - Requisitos de facturación electrónica
   
4. **Licencia de Bebidas Alcohólicas** (si aplica)
   - Tipos de licencias disponibles
   - Costos y requisitos
   
5. **Otros Requisitos**
   - Seguros obligatorios
   - Registro de marca (IMPI)
   - Alta patronal (IMSS)

Para cada trámite incluye:
- Costo aproximado actual
- Tiempo estimado de obtención
- Documentos necesarios
- Dirección/contacto de la dependencia

Formato tu respuesta en JSON estructurado.
`,

  location_analysis: (data) => `
Realiza un análisis de ubicación ACTUAL para abrir un ${data.businessType} ${data.cuisineType ? `de cocina ${data.cuisineType}` : ''} en ${data.city}, ${data.country}${data.neighborhood ? `, preferentemente en ${data.neighborhood}` : ''}.

Busca información REAL y ACTUALIZADA sobre:

1. **Mejores Zonas Recomendadas**
   - Top 5 colonias/zonas para este tipo de negocio
   - Razones de cada recomendación
   - Perfil demográfico de cada zona
   
2. **Costos de Renta**
   - Precio promedio por m² en cada zona
   - Rango de precios para locales comerciales de 50-150 m²
   - Tendencia del mercado inmobiliario comercial
   
3. **Análisis de Competencia**
   - Densidad de negocios similares por zona
   - Restaurantes exitosos como referencia
   - Oportunidades de diferenciación
   
4. **Factores de Éxito por Zona**
   - Flujo peatonal
   - Estacionamiento disponible
   - Acceso a transporte público
   - Negocios complementarios cercanos
   
5. **Requisitos de Uso de Suelo**
   - Zonas con uso comercial permitido
   - Restricciones específicas

${data.estimatedBudget ? `Considera un presupuesto estimado de $${data.estimatedBudget.toLocaleString()} MXN.` : ''}

Formato tu respuesta en JSON estructurado.
`,

  equipment_setup: (data) => `
Lista el equipamiento necesario para abrir un ${data.businessType} ${data.cuisineType ? `de cocina ${data.cuisineType}` : ''} en ${data.city}, ${data.country}.

Busca información ACTUAL sobre proveedores y precios REALES:

1. **Equipo de Cocina Esencial**
   - Estufas industriales
   - Refrigeradores/congeladores comerciales
   - Campanas de extracción
   - Mesas de trabajo en acero inoxidable
   - Freidoras (si aplica)
   - Hornos
   - Equipo específico para ${data.cuisineType || 'cocina general'}
   
2. **Equipo de Servicio**
   - Mobiliario (mesas, sillas)
   - Cristalería, loza, cubiertos
   - Punto de venta (POS)
   - Sistema de sonido
   
3. **Proveedores Locales**
   - Nombre de proveedores REALES en ${data.city}
   - Direcciones y contactos
   - Opciones nuevo vs usado
   
4. **Costos Estimados**
   - Inversión mínima en equipo
   - Inversión recomendada
   - Opciones de financiamiento/arrendamiento

${data.estimatedBudget ? `Presupuesto total estimado: $${data.estimatedBudget.toLocaleString()} MXN.` : ''}

Formato tu respuesta en JSON estructurado.
`,

  supplier_network: (data) => `
Identifica la red de proveedores para un ${data.businessType} ${data.cuisineType ? `de cocina ${data.cuisineType}` : ''} en ${data.city}, ${data.country}.

Busca información REAL y ACTUALIZADA:

1. **Centrales de Abasto**
   - Mercados mayoristas en ${data.city}
   - Días y horarios de operación
   - Productos especializados
   
2. **Distribuidores de Alimentos**
   - Proveedores de carnes (con certificación TIF si aplica)
   - Proveedores de mariscos
   - Frutas y verduras
   - Productos lácteos
   - Abarrotes y secos
   
3. **Proveedores Especializados para ${data.cuisineType || 'cocina general'}**
   - Ingredientes especiales
   - Importadores
   
4. **Servicios de Entrega**
   - Proveedores con servicio a domicilio
   - Frecuencia de entregas
   
5. **Comparativa de Precios**
   - Productos básicos con precios promedio
   - Opciones por volumen
   
6. **Insumos No Alimentarios**
   - Proveedores de desechables
   - Productos de limpieza
   - Uniformes

Incluye nombres REALES, direcciones, teléfonos y sitios web cuando estén disponibles.

Formato tu respuesta en JSON estructurado.
`,

  staffing_plan: (data) => `
Desarrolla un plan de personal para un ${data.businessType} ${data.cuisineType ? `de cocina ${data.cuisineType}` : ''} en ${data.city}, ${data.country}.

Busca información ACTUAL sobre el mercado laboral:

1. **Organigrama Recomendado**
   - Puestos necesarios para la operación
   - Cantidad de personal por turno
   - Estructura de mandos
   
2. **Salarios Promedio en ${data.city}**
   - Chef ejecutivo
   - Cocineros de línea
   - Ayudantes de cocina
   - Meseros
   - Cajero/Hostess
   - Personal de limpieza
   - Gerente
   
3. **Bolsas de Trabajo Especializadas**
   - Plataformas de reclutamiento gastronómico
   - Escuelas de gastronomía locales
   - Grupos de Facebook/WhatsApp del sector
   
4. **Requisitos Laborales**
   - Alta en IMSS
   - Contratos recomendados
   - Prestaciones de ley
   - Costos patronales (aproximado % sobre salario)
   
5. **Capacitación**
   - Cursos obligatorios (manejo de alimentos)
   - Programas de capacitación recomendados
   
6. **Turnos y Horarios**
   - Estructura de turnos típica
   - Consideraciones de ley

Formato tu respuesta en JSON estructurado.
`,

  marketing_launch: (data) => `
Desarrolla una estrategia de lanzamiento para un ${data.businessType} ${data.cuisineType ? `de cocina ${data.cuisineType}` : ''} en ${data.city}, ${data.country}.

Busca información ACTUAL sobre el mercado local:

1. **Pre-apertura (4-6 semanas antes)**
   - Estrategia de expectativa
   - Creación de redes sociales
   - Base de datos de prospectos
   
2. **Plataformas de Delivery**
   - Uber Eats, Rappi, DiDi Food en ${data.city}
   - Comisiones actuales de cada plataforma
   - Proceso de alta
   
3. **Marketing Digital**
   - Agencias de marketing gastronómico en ${data.city}
   - Food bloggers e influencers locales
   - Fotógrafos de alimentos
   - Costos aproximados
   
4. **Redes Sociales**
   - Estrategia por plataforma (Instagram, TikTok, Facebook)
   - Frecuencia de publicación recomendada
   - Tipos de contenido que funcionan
   
5. **Evento de Inauguración**
   - Ideas para soft opening
   - Gran apertura
   - Promociones de lanzamiento efectivas
   
6. **Alianzas Estratégicas**
   - Colaboraciones con negocios complementarios
   - Programas de lealtad
   - Convenios corporativos

${data.estimatedBudget ? `Considera un presupuesto de marketing del 5-10% del presupuesto total ($${(data.estimatedBudget * 0.05).toLocaleString()} - $${(data.estimatedBudget * 0.1).toLocaleString()} MXN).` : ''}

Formato tu respuesta en JSON estructurado.
`,

  financial_projection: (data) => `
Genera una proyección financiera para un ${data.businessType} ${data.cuisineType ? `de cocina ${data.cuisineType}` : ''} en ${data.city}, ${data.country}.

${data.estimatedBudget ? `Inversión inicial estimada: $${data.estimatedBudget.toLocaleString()} MXN.` : ''}

Busca información ACTUAL del mercado:

1. **Inversión Inicial Detallada**
   - Adecuación del local
   - Equipamiento
   - Inventario inicial
   - Capital de trabajo (3-6 meses)
   - Permisos y licencias
   - Marketing de lanzamiento
   - Contingencias (10-15%)
   
2. **Costos Fijos Mensuales**
   - Renta (basado en zona de ${data.city})
   - Nómina y cargas sociales
   - Servicios (luz, agua, gas, internet)
   - Software/sistemas
   - Seguros
   - Mantenimiento
   
3. **Costos Variables**
   - Costo de alimentos (% de venta recomendado)
   - Comisiones delivery
   - Insumos desechables
   
4. **Proyección de Ingresos**
   - Ticket promedio por tipo de servicio
   - Capacidad del local
   - Rotación de mesas esperada
   - Ingresos por canal (comedor, delivery, para llevar)
   
5. **Métricas Clave de la Industria en ${data.country}**
   - Food cost objetivo
   - Labor cost objetivo
   - Margen de utilidad típico
   
6. **Punto de Equilibrio**
   - Ventas mensuales necesarias
   - Comensales por día
   
7. **Retorno de Inversión**
   - ROI estimado
   - Periodo de recuperación

Formato tu respuesta en JSON estructurado.
`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, projectData, phase, question }: BusinessOpeningRequest = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    let systemPrompt = `Eres un experto consultor en apertura de negocios gastronómicos en Latinoamérica. 
Tienes acceso a información actualizada a través de búsqueda web.
Siempre proporcionas información específica, práctica y contextualizada a la región del usuario.
Tus respuestas deben ser detalladas pero organizadas, con datos reales y fuentes verificables.
SIEMPRE responde en español.`;

    let userPrompt = '';

    if (action === 'analyze_phase' && phase && PHASE_PROMPTS[phase]) {
      userPrompt = PHASE_PROMPTS[phase](projectData);
    } else if (action === 'ask_question' && question) {
      userPrompt = `
El usuario está planeando abrir un ${projectData.businessType} ${projectData.cuisineType ? `de cocina ${projectData.cuisineType}` : ''} 
en ${projectData.city}, ${projectData.country}${projectData.neighborhood ? `, en la zona de ${projectData.neighborhood}` : ''}.
${projectData.estimatedBudget ? `Su presupuesto estimado es de $${projectData.estimatedBudget.toLocaleString()} MXN.` : ''}

Su pregunta es: ${question}

Busca información ACTUAL y ESPECÍFICA para responder. Incluye fuentes cuando sea posible.
`;
    } else if (action === 'generate_checklist') {
      userPrompt = `
Genera un checklist completo y detallado para abrir un ${projectData.businessType} ${projectData.cuisineType ? `de cocina ${projectData.cuisineType}` : ''} 
en ${projectData.city}, ${projectData.country}.

El checklist debe estar organizado por fases:
1. Planeación (2-3 meses antes)
2. Legal y Permisos (2-3 meses antes)
3. Ubicación (1-2 meses antes)
4. Equipamiento (1-2 meses antes)
5. Proveedores (1 mes antes)
6. Personal (1 mes antes)
7. Marketing Pre-apertura (1 mes antes)
8. Pre-apertura (2 semanas antes)
9. Apertura

Para cada tarea incluye:
- Título claro
- Descripción breve
- Fase a la que pertenece

Responde en formato JSON con un array de objetos: { phase, title, description, sortOrder }
`;
    } else {
      throw new Error('Invalid action or missing parameters');
    }

    console.log(`Processing ${action} for ${projectData.businessType} in ${projectData.city}, ${projectData.country}`);

    // Use OpenAI with web search capability
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        tools: [{ type: 'web_search_preview' }],
        input: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the text response
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
      }
    }

    // Try to parse JSON from the response
    let analysisData = null;
    try {
      // Look for JSON in the response
      const jsonMatch = analysisText.match(/```json\n?([\s\S]*?)\n?```/) || 
                       analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        analysisData = JSON.parse(jsonStr);
      }
    } catch (e) {
      console.log('Could not parse JSON from response, using text');
    }

    return new Response(
      JSON.stringify({
        success: true,
        action,
        phase,
        analysis: analysisText,
        structured_data: analysisData,
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
