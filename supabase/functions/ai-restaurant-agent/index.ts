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

      case 'suppliers':
        systemPrompt = `Eres un experto en gestión de cadena de suministro para restaurantes con acceso a búsqueda web para precios de mercado actualizados, directorio de proveedores y benchmarks de la industria. Comparas proveedores por rendimiento, puntualidad y precio. Generas estrategias de negociación basadas en volumen y condiciones de mercado. Buscas proveedores alternativos y evalúas el riesgo de la cadena de suministro. Respondes en español con datos verificables y recomendaciones accionables.`;
        break;

      case 'inventory':
        systemPrompt = `Eres un experto en gestión de inventarios para restaurantes con acceso a búsqueda web para precios actualizados de ingredientes y tendencias de mercado. Optimizas cantidades de pedido, predices necesidades de reabastecimiento, detectas patrones de desperdicio y analizas tendencias de costos. Generas alertas proactivas y recomendaciones para reducir mermas. Respondes en español con análisis basados en datos.`;
        break;

      case 'delivery':
        systemPrompt = `Eres un experto en logística de delivery y domicilios para restaurantes con acceso a búsqueda web para obtener mejores prácticas de la industria y tecnologías de optimización. Analizas demanda por zona y horario, optimizas tiempos de entrega, evalúas rendimiento de repartidores y pronosticas picos de demanda. Generas estrategias para mejorar tiempos y satisfacción del cliente. Respondes en español con recomendaciones prácticas.`;
        break;

      case 'loyalty':
        systemPrompt = `Eres un experto en marketing de retención y programas de fidelización para restaurantes con acceso a búsqueda web para benchmarks de la industria y mejores prácticas de CRM. Analizas riesgo de abandono (churn), generas estrategias de retención personalizadas, optimizas programas de puntos y recompensas, y calculas lifetime value. Creas campañas de recuperación de clientes y ofertas personalizadas. Respondes en español con tácticas accionables basadas en datos.`;
        break;

      case 'reservations':
        systemPrompt = `Eres un experto en gestión de reservaciones para restaurantes. Predices probabilidad de no-show basándote en patrones históricos, optimizas capacidad por horario, generas estrategias de overbooking inteligente y creas plantillas de confirmación personalizadas. Respondes en español con recomendaciones basadas en datos.`;
        break;

      case 'staff-schedule':
        systemPrompt = `Eres un experto en optimización de turnos y horarios de personal para restaurantes con acceso a búsqueda web para salarios de mercado y regulaciones laborales. Optimizas distribución de personal según demanda histórica, predices horas extra, analizas cobertura por hora y pronosticas costos laborales. Respondes en español con recomendaciones de eficiencia operativa.`;
        break;

      case 'recipes':
        systemPrompt = `Eres un experto en ingeniería culinaria y gestión de recetas para restaurantes con acceso a búsqueda web para precios de ingredientes y tendencias gastronómicas. Optimizas costos de recetas sin afectar calidad, sugieres sustitutos más económicos, recomiendas maridajes y combos, y analizas información nutricional. Respondes en español con análisis detallados y prácticos.`;
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

      // ====== SUPPLIERS MODULE ======
      case 'supplier_analysis':
        userPrompt = `Analiza estos proveedores del restaurante: ${JSON.stringify(data)}.

Proporciona:
1. Evaluación comparativa de cada proveedor (precio, calidad, puntualidad)
2. Identificación de proveedores con mejores y peores condiciones
3. Oportunidades de consolidación de compras
4. Riesgos en la cadena de suministro actual
5. Recomendaciones para diversificar proveedores críticos
6. Busca precios de mercado actuales para los productos mencionados`;
        break;

      case 'supplier_negotiation':
        userPrompt = `Genera estrategias de negociación para estos proveedores: ${JSON.stringify(data)}.

Proporciona:
1. Puntos de negociación específicos para cada proveedor
2. Descuentos por volumen típicos en la industria
3. Condiciones de pago que puedes solicitar
4. Argumentos basados en precios de mercado actuales
5. Alternativas de proveedores si la negociación falla`;
        break;

      case 'alternative_suppliers':
        userPrompt = `Busca proveedores alternativos para estos productos: ${JSON.stringify(data)}.

Busca y proporciona:
1. Proveedores alternativos por categoría en la zona indicada
2. Rangos de precios de mercado actuales
3. Ventajas y desventajas de cada alternativa
4. Recomendación de proveedores a contactar
5. Información de contacto si está disponible públicamente`;
        break;

      // ====== INVENTORY MODULE ======
      case 'reorder_optimization':
        userPrompt = `Optimiza las cantidades de pedido para este inventario: ${JSON.stringify(data)}.

Proporciona:
1. Cantidad óptima de pedido (EOQ) por producto
2. Frecuencia de pedido recomendada
3. Nivel de stock de seguridad sugerido
4. Prioridad de reabastecimiento (urgente, pronto, normal)
5. Ahorro estimado por optimización de pedidos
6. Precios actuales de mercado para comparar`;
        break;

      case 'expiry_prediction':
        userPrompt = `Analiza el riesgo de caducidad y desperdicio en este inventario: ${JSON.stringify(data)}.

Proporciona:
1. Productos con mayor riesgo de caducidad
2. Predicción de desperdicio en los próximos 7 días
3. Estrategias para usar productos próximos a vencer
4. Platos especiales sugeridos para aprovechar inventario
5. Costo potencial del desperdicio y cómo evitarlo`;
        break;

      case 'cost_trend_analysis':
        userPrompt = `Analiza tendencias de costos de ingredientes: ${JSON.stringify(data)}.

Proporciona:
1. Ingredientes con mayor aumento de precio reciente
2. Tendencias de mercado para ingredientes clave
3. Predicción de precios para próximos meses
4. Estrategias de compra anticipada recomendadas
5. Sustitutos más económicos sin afectar calidad`;
        break;

      // ====== DELIVERY MODULE ======
      case 'demand_forecast':
        userPrompt = `Pronostica la demanda de delivery basándote en: ${JSON.stringify(data)}.

Proporciona:
1. Predicción de pedidos por día y hora para la próxima semana
2. Zonas con mayor potencial de crecimiento
3. Horarios pico y valles de demanda
4. Factores externos que pueden afectar (clima, eventos, etc.)
5. Recomendaciones de capacidad de entrega`;
        break;

      case 'delivery_optimization':
        userPrompt = `Optimiza las operaciones de delivery con estos datos: ${JSON.stringify(data)}.

Proporciona:
1. Tiempos de entrega óptimos por zona
2. Identificación de cuellos de botella en el proceso
3. Estrategias para reducir tiempos de entrega
4. Recomendaciones de rutas o agrupación de pedidos
5. KPIs objetivo para mejorar rendimiento`;
        break;

      case 'driver_performance':
        userPrompt = `Analiza el rendimiento de repartidores: ${JSON.stringify(data)}.

Proporciona:
1. Ranking de repartidores por eficiencia
2. Áreas de mejora por cada repartidor
3. Benchmarks de la industria para tiempos de entrega
4. Incentivos recomendados para mejorar rendimiento
5. Capacitación sugerida si hay problemas recurrentes`;
        break;

      // ====== LOYALTY MODULE ======
      case 'churn_prevention':
        userPrompt = `Analiza estos clientes en riesgo de abandono y genera estrategias de retención: ${JSON.stringify(data)}.

Proporciona:
1. Análisis de cada cliente: por qué está en riesgo
2. Estrategia de recuperación personalizada para cada uno
3. Ofertas o incentivos específicos recomendados
4. Canal de comunicación óptimo (email, SMS, WhatsApp)
5. Mensaje sugerido para cada cliente
6. Prioridad de contacto (alto, medio, bajo)`;
        break;

      case 'loyalty_recommendations':
        userPrompt = `Genera recomendaciones para el programa de fidelización: ${JSON.stringify(data)}.

Proporciona:
1. Análisis de efectividad del programa actual
2. Ajustes recomendados a niveles y beneficios
3. Nuevas recompensas sugeridas según tendencias
4. Estrategias para aumentar participación
5. Benchmarks de programas de lealtad en restaurantes`;
        break;

      case 'personalized_offers':
        userPrompt = `Genera ofertas personalizadas para estos clientes: ${JSON.stringify(data)}.

Proporciona:
1. Oferta específica para cada cliente basada en su historial
2. Momento óptimo para enviar cada oferta
3. Valor del descuento/beneficio que maximiza conversión
4. Mensaje personalizado sugerido
5. Estimación de ROI de cada campaña`;
        break;

      case 'ltv_optimization':
        userPrompt = `Analiza y optimiza el lifetime value de estos clientes: ${JSON.stringify(data)}.

Proporciona:
1. Segmentación de clientes por LTV actual y potencial
2. Estrategias para aumentar LTV por segmento
3. Productos/servicios con mayor impacto en LTV
4. Frecuencia de compra óptima por segmento
5. Inversión recomendada en retención vs adquisición`;
        break;

      // ====== RESERVATIONS MODULE ======
      case 'no_show_prediction':
        userPrompt = `Analiza el historial de reservaciones y predice probabilidad de no-show: ${JSON.stringify(data)}.

Proporciona:
1. Clientes con mayor probabilidad de no-show (ordenados por riesgo)
2. Factores que aumentan el riesgo de no-show
3. Estrategias de confirmación recomendadas por segmento
4. Tasa de no-show actual vs benchmark de la industria
5. Acciones preventivas para reducir no-shows`;
        break;

      case 'capacity_optimization':
        userPrompt = `Optimiza la capacidad de reservaciones del restaurante: ${JSON.stringify(data)}.

Proporciona:
1. Horarios con capacidad subutilizada
2. Horarios con exceso de demanda
3. Estrategia de overbooking inteligente (si aplica)
4. Tiempos de rotación óptimos por mesa
5. Recomendaciones para maximizar ingresos por asiento`;
        break;

      case 'confirmation_templates':
        userPrompt = `Genera plantillas de confirmación personalizadas para estas reservaciones: ${JSON.stringify(data)}.

Proporciona:
1. Mensaje de confirmación inicial (personalizado por ocasión)
2. Recordatorio 24h antes
3. Recordatorio día de la reserva
4. Mensaje post-visita para feedback
5. Mensaje de recuperación si no asiste`;
        break;

      // ====== STAFF SCHEDULE MODULE ======
      case 'schedule_optimization':
        userPrompt = `Optimiza los horarios de turnos de personal: ${JSON.stringify(data)}.

Proporciona:
1. Distribución óptima de personal por hora y día
2. Turnos donde hay exceso o falta de personal
3. Ahorro estimado en costos laborales
4. Recomendaciones de horarios flexibles
5. Comparación con benchmarks de personal por cubierto`;
        break;

      case 'overtime_prediction':
        userPrompt = `Predice las horas extra para la próxima semana: ${JSON.stringify(data)}.

Proporciona:
1. Empleados con mayor probabilidad de horas extra
2. Días con mayor riesgo de overtime
3. Costo proyectado de horas extra
4. Estrategias para reducir overtime no planificado
5. Recomendaciones de contratación o turnos adicionales`;
        break;

      case 'coverage_analysis':
        userPrompt = `Analiza la cobertura de personal por hora: ${JSON.stringify(data)}.

Proporciona:
1. Horas con cobertura insuficiente
2. Horas con exceso de personal
3. Ratio personal/clientes por hora
4. Impacto en calidad de servicio
5. Ajustes de horario recomendados`;
        break;

      case 'labor_cost_forecast':
        userPrompt = `Pronostica los costos laborales: ${JSON.stringify(data)}.

Proporciona:
1. Proyección de costos laborales semanales/mensuales
2. Porcentaje de labor cost vs ventas proyectado
3. Comparación con benchmark de la industria (25-35%)
4. Oportunidades de optimización
5. Impacto de contrataciones/despidos`;
        break;

      // ====== FEEDBACK MODULE ======
      case 'feedback_trends':
        userPrompt = `Analiza las tendencias en el feedback de clientes: ${JSON.stringify(data)}.

Proporciona:
1. Tendencias positivas y negativas identificadas
2. Temas recurrentes en comentarios
3. Cambios en satisfacción a lo largo del tiempo
4. Áreas de mejora prioritarias según impacto
5. Correlación entre aspectos (comida, servicio, ambiente)`;
        break;

      case 'improvement_priorities':
        userPrompt = `Prioriza las mejoras basándote en el feedback de clientes: ${JSON.stringify(data)}.

Proporciona:
1. Top 5 mejoras ordenadas por impacto potencial
2. Costo estimado de implementación por mejora
3. Tiempo estimado para ver resultados
4. Quick wins (mejoras rápidas y fáciles)
5. Mejoras estructurales a largo plazo`;
        break;

      case 'response_templates':
        userPrompt = `Genera respuestas personalizadas para este feedback: ${JSON.stringify(data)}.

Proporciona:
1. Respuesta empática y personalizada para cada feedback
2. Solución o compensación apropiada si aplica
3. Invitación a regresar con incentivo
4. Tono apropiado según el sentimiento del cliente
5. Seguimiento recomendado`;
        break;

      // ====== RECIPES MODULE ======
      case 'recipe_optimization':
        userPrompt = `Optimiza los costos de estas recetas sin afectar calidad: ${JSON.stringify(data)}.

Proporciona:
1. Análisis de costo actual por porción
2. Ingredientes con mayor oportunidad de ahorro
3. Sustitutos recomendados con impacto en calidad
4. Ahorro potencial por receta
5. Ajustes de porciones si aplica`;
        break;

      case 'ingredient_substitution':
        userPrompt = `Sugiere sustitutos de ingredientes más económicos: ${JSON.stringify(data)}.

Proporciona:
1. Ingredientes caros con alternativas viables
2. Diferencia de costo por sustitución
3. Impacto en sabor y textura (bajo/medio/alto)
4. Proveedores sugeridos para sustitutos
5. Recetas donde aplicar cada sustitución`;
        break;

      case 'menu_pairing':
        userPrompt = `Recomienda maridajes y combos para estas recetas: ${JSON.stringify(data)}.

Proporciona:
1. Maridajes de bebidas por platillo
2. Combos rentables (entrada + plato + postre)
3. Sugerencias de upselling por receta
4. Precios sugeridos para combos
5. Margen de ganancia por combo`;
        break;

      case 'nutritional_analysis':
        userPrompt = `Analiza la información nutricional estimada de estas recetas: ${JSON.stringify(data)}.

Proporciona:
1. Estimación de calorías por porción
2. Macronutrientes (proteína, carbohidratos, grasa)
3. Alérgenos presentes
4. Clasificación (bajo en calorías, alto en proteína, etc.)
5. Sugerencias para opciones más saludables`;
        break;

      // ====== POS/SALES MODULE ======
      case 'sales_pattern_analysis':
        userPrompt = `Analiza los patrones de venta del POS: ${JSON.stringify(data)}.

Proporciona:
1. Productos más vendidos por hora y día
2. Combinaciones frecuentes de productos
3. Ticket promedio por horario
4. Tendencias de ventas (crecimiento/declive)
5. Oportunidades de upselling identificadas`;
        break;

      case 'peak_hour_analysis':
        userPrompt = `Analiza las horas pico de venta: ${JSON.stringify(data)}.

Proporciona:
1. Horas con mayor volumen de ventas
2. Productos preferidos por hora
3. Personal recomendado por hora pico
4. Tiempo promedio de atención en horas pico
5. Estrategias para maximizar ventas en pico`;
        break;

      case 'payment_analysis':
        userPrompt = `Analiza los métodos de pago y propinas: ${JSON.stringify(data)}.

Proporciona:
1. Distribución de métodos de pago
2. Ticket promedio por método de pago
3. Tendencias de propinas
4. Recomendaciones para incentivar métodos preferidos
5. Oportunidades de ahorro en comisiones`;
        break;

      // ====== KITCHEN/KDS MODULE ======
      case 'preparation_time_prediction':
        userPrompt = `Predice tiempos de preparación en cocina: ${JSON.stringify(data)}.

Proporciona:
1. Tiempo estimado de preparación por platillo
2. Cuellos de botella identificados
3. Platillos que retrasan la línea
4. Recomendaciones para optimizar tiempos
5. Orden óptimo de preparación`;
        break;

      case 'kitchen_efficiency':
        userPrompt = `Analiza la eficiencia de cocina: ${JSON.stringify(data)}.

Proporciona:
1. Tiempo promedio de preparación vs objetivo
2. Pedidos con retrasos y causas
3. Estaciones con mayor carga de trabajo
4. Recomendaciones de flujo de trabajo
5. Capacitación sugerida por área`;
        break;

      case 'queue_optimization':
        userPrompt = `Optimiza la cola de pedidos en cocina: ${JSON.stringify(data)}.

Proporciona:
1. Priorización óptima de pedidos
2. Agrupación inteligente por tipo de cocción
3. Balance de carga entre estaciones
4. Tiempo estimado de completar cola actual
5. Alertas de capacidad máxima`;
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
