import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { differenceInDays } from 'date-fns';
import { useAggregatedFinances } from './useAggregatedFinances';

export interface First90DaysMetrics {
  daysOpen: number;
  daysRemaining: number;
  progressPercentage: number;
  weekNumber: number;
  // Revenue metrics
  totalRevenue: number;
  averageDailyRevenue: number;
  revenueGrowth: number[];
  projectedMonthlyRevenue: number;
  // Customer metrics
  totalCustomers: number;
  averageDailyCustomers: number;
  customerGrowth: number[];
  repeatCustomerRate: number;
  // Operational metrics
  averageTicket: number;
  ticketTrend: 'up' | 'down' | 'stable';
  peakDays: string[];
  peakHours: string[];
  // Efficiency metrics
  foodCostAverage: number;
  laborCostAverage: number;
  wastageReduction: number;
  // Milestones
  milestones: Milestone[];
  // Recommendations
  weeklyFocus: WeeklyFocus;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDay: number;
  isCompleted: boolean;
  completedAt?: string;
  category: 'revenue' | 'operations' | 'marketing' | 'team' | 'customer';
}

export interface WeeklyFocus {
  weekNumber: number;
  title: string;
  description: string;
  objectives: string[];
  tips: string[];
}

// Weekly focus areas for new restaurants
const WEEKLY_FOCUSES: Record<number, Omit<WeeklyFocus, 'weekNumber'>> = {
  1: {
    title: 'Estabilización Operativa',
    description: 'Enfócate en afinar procesos y resolver problemas operativos inmediatos',
    objectives: [
      'Ajustar tiempos de servicio',
      'Calibrar inventario inicial',
      'Identificar cuellos de botella',
      'Recopilar feedback del equipo'
    ],
    tips: [
      'Es normal tener ajustes esta semana',
      'Documenta todos los problemas que surjan',
      'Mantén comunicación constante con el equipo'
    ]
  },
  2: {
    title: 'Refinamiento del Menú',
    description: 'Analiza qué platillos funcionan y cuáles necesitan ajustes',
    objectives: [
      'Identificar platillos más vendidos',
      'Detectar platillos con bajo rendimiento',
      'Ajustar porciones si es necesario',
      'Optimizar tiempos de preparación'
    ],
    tips: [
      'Habla con los clientes sobre sus platillos favoritos',
      'Revisa el desperdicio de cada platillo',
      'Considera eliminar platillos que no vendan'
    ]
  },
  3: {
    title: 'Construcción de Base de Clientes',
    description: 'Comienza a crear tu base de clientes leales',
    objectives: [
      'Implementar programa de lealtad básico',
      'Recopilar datos de contacto de clientes',
      'Solicitar reseñas en Google/Yelp',
      'Crear presencia en redes sociales'
    ],
    tips: [
      'Ofrece un incentivo por primera visita',
      'Responde a todas las reseñas',
      'Publica fotos de platillos diariamente'
    ]
  },
  4: {
    title: 'Optimización de Costos',
    description: 'Revisa y ajusta tu estructura de costos',
    objectives: [
      'Analizar food cost real vs proyectado',
      'Renegociar con proveedores si es necesario',
      'Optimizar horarios del personal',
      'Identificar gastos innecesarios'
    ],
    tips: [
      'El food cost ideal es 28-32%',
      'Revisa tus desperdicios semanales',
      'Ajusta órdenes basándote en ventas reales'
    ]
  },
  5: {
    title: 'Experiencia del Cliente',
    description: 'Mejora la experiencia general del cliente',
    objectives: [
      'Implementar encuestas de satisfacción',
      'Entrenar al equipo en servicio',
      'Optimizar flujo del restaurante',
      'Mejorar presentación de platillos'
    ],
    tips: [
      'Un cliente satisfecho trae 3 más',
      'El tiempo de espera ideal es < 15 min',
      'Pequeños detalles marcan la diferencia'
    ]
  },
  6: {
    title: 'Marketing Local',
    description: 'Expande tu alcance en la comunidad local',
    objectives: [
      'Alianzas con negocios cercanos',
      'Participar en eventos locales',
      'Promociones para vecinos',
      'Optimizar Google My Business'
    ],
    tips: [
      'Los clientes locales son los más leales',
      'Ofrece descuentos a oficinas cercanas',
      'Considera catering para eventos'
    ]
  },
  7: {
    title: 'Eficiencia Operativa',
    description: 'Optimiza procesos para mayor eficiencia',
    objectives: [
      'Estandarizar recetas y porciones',
      'Implementar checklists de apertura/cierre',
      'Optimizar layout de cocina',
      'Reducir tiempos muertos'
    ],
    tips: [
      'Cada minuto ahorrado cuenta',
      'Documenta todos los procesos',
      'Involucra al equipo en mejoras'
    ]
  },
  8: {
    title: 'Desarrollo del Equipo',
    description: 'Invierte en tu equipo para mejorar servicio',
    objectives: [
      'Capacitación en servicio al cliente',
      'Cross-training entre posiciones',
      'Establecer metas y bonos',
      'Crear cultura de equipo'
    ],
    tips: [
      'Un equipo motivado = mejor servicio',
      'Reconoce los logros públicamente',
      'Escucha las sugerencias del equipo'
    ]
  },
  9: {
    title: 'Análisis de Datos',
    description: 'Usa los datos para tomar mejores decisiones',
    objectives: [
      'Revisar métricas de 2 meses',
      'Identificar tendencias',
      'Ajustar proyecciones',
      'Planear próximo trimestre'
    ],
    tips: [
      'Los datos no mienten',
      'Compara semanas similares',
      'Identifica qué funcionó y qué no'
    ]
  },
  10: {
    title: 'Innovación del Menú',
    description: 'Introduce novedades basadas en lo aprendido',
    objectives: [
      'Agregar 2-3 platillos nuevos',
      'Crear especiales de temporada',
      'Probar precios optimizados',
      'Desarrollar platillos signature'
    ],
    tips: [
      'Innova con base en feedback',
      'Prueba antes de lanzar',
      'Los especiales generan urgencia'
    ]
  },
  11: {
    title: 'Fidelización',
    description: 'Consolida tu base de clientes frecuentes',
    objectives: [
      'Analizar tasa de retorno',
      'Mejorar programa de lealtad',
      'Crear eventos exclusivos',
      'Personalizar experiencias'
    ],
    tips: [
      'Retener es más barato que adquirir',
      'Conoce a tus mejores clientes por nombre',
      'Ofrece beneficios exclusivos'
    ]
  },
  12: {
    title: 'Planificación del Crecimiento',
    description: 'Evalúa los 90 días y planea el futuro',
    objectives: [
      'Revisar todos los KPIs',
      'Celebrar logros del equipo',
      'Planear próximos 90 días',
      'Definir metas de crecimiento'
    ],
    tips: [
      '¡Felicidades por llegar aquí!',
      'Documenta las lecciones aprendidas',
      'El siguiente nivel te espera'
    ]
  },
  13: {
    title: 'Consolidación',
    description: 'Estás en la recta final de tus primeros 90 días',
    objectives: [
      'Finalizar evaluación completa',
      'Establecer baseline de madurez',
      'Crear plan de mejora continua',
      'Transicionar a operación normal'
    ],
    tips: [
      'Ya no eres un restaurante "nuevo"',
      'Ahora tienes data real para decidir',
      'El aprendizaje nunca termina'
    ]
  }
};

// Default milestones for new restaurants
const DEFAULT_MILESTONES: Omit<Milestone, 'id' | 'isCompleted' | 'completedAt'>[] = [
  { title: 'Primera Semana Completa', description: 'Sobrevivir la primera semana de operación', targetDay: 7, category: 'operations' },
  { title: '100 Clientes', description: 'Atender a los primeros 100 clientes', targetDay: 14, category: 'customer' },
  { title: 'Primera Reseña 5 Estrellas', description: 'Obtener la primera reseña perfecta', targetDay: 10, category: 'customer' },
  { title: 'Food Cost < 35%', description: 'Lograr un food cost menor al 35%', targetDay: 30, category: 'operations' },
  { title: 'Equipo Estable', description: 'Mantener al equipo original por un mes', targetDay: 30, category: 'team' },
  { title: 'Primer Mes Rentable', description: 'Cerrar el primer mes con utilidad', targetDay: 30, category: 'revenue' },
  { title: '10 Clientes Frecuentes', description: 'Tener 10 clientes que regresen 3+ veces', targetDay: 45, category: 'customer' },
  { title: 'Redes Activas', description: 'Alcanzar 500 seguidores en redes', targetDay: 45, category: 'marketing' },
  { title: 'Food Cost < 32%', description: 'Optimizar food cost a menos del 32%', targetDay: 60, category: 'operations' },
  { title: 'Segundo Mes Rentable', description: 'Segundo mes consecutivo con utilidad', targetDay: 60, category: 'revenue' },
  { title: 'Evento Especial', description: 'Realizar primer evento o promoción especial', targetDay: 75, category: 'marketing' },
  { title: '90 Días Operando', description: '¡Completaste tus primeros 90 días!', targetDay: 90, category: 'revenue' },
];

export function useFirst90Days() {
  const { user } = useAuth();

  const { data: businessData, isLoading: loadingBusiness } = useQuery({
    queryKey: ['restaurant-business', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_businesses')
        .select('*')
        .eq('owner_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: diagnosisData } = useQuery({
    queryKey: ['baseline-diagnosis', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maturity_diagnoses')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Calculate if restaurant is within first 90 days
  // Use opening_date if available, fallback to created_at
  const openDate = businessData?.opening_date 
    ? new Date(businessData.opening_date) 
    : businessData?.created_at 
      ? new Date(businessData.created_at) 
      : null;

  const isNewRestaurant = openDate 
    ? differenceInDays(new Date(), openDate) <= 90
    : false;

  const daysOpen = openDate 
    ? differenceInDays(new Date(), openDate)
    : 0;

  const weekNumber = Math.min(Math.ceil(daysOpen / 7), 13);

  // B-27: evaluación honesta de hitos — por métrica real, no por antigüedad.
  // B-23: los hitos se evalúan con el MOTOR CANÓNICO, no con `daily_sales` crudo.
  // Antes: food% sobre ingreso bruto (con IVA) y utilidad sin `other_costs`,
  // leyendo solo la captura manual e ignorando ventas de POS, deducciones de
  // inventario y turnos. Un restaurante podía aparecer "rentable" aquí y no
  // serlo en Finanzas — el mismo negocio, el mismo rango, dos veredictos.
  const { kpis: canonicalKpis, dailySales: canonicalDaily } = useAggregatedFinances(
    openDate ? { start: openDate, end: new Date() } : undefined
  );
  const _fRevenue = canonicalKpis?.totalRevenue ?? 0;
  const _fCustomers = canonicalKpis?.totalCovers ?? 0;
  const _fFoodPct = canonicalKpis?.foodCostPercentage ?? 0;
  const _fNetProfit = canonicalKpis?.netProfit ?? 0;
  const evalMilestone = (m: { title: string; targetDay: number }): boolean => {
    const t = m.title.toLowerCase();
    if (t.includes('semana') || t.includes('días operando') || t.includes('90 días')) return daysOpen >= m.targetDay;
    if (t.includes('food cost < 35')) return _fFoodPct > 0 && _fFoodPct < 35;
    if (t.includes('food cost < 32')) return _fFoodPct > 0 && _fFoodPct < 32;
    if (t.includes('100 clientes')) return _fCustomers >= 100;
    if (t.includes('rentable')) return _fRevenue > 0 && _fNetProfit > 0;
    return false; // reseñas, seguidores, equipo, evento, clientes frecuentes: no auto-completar
  };

  // Build metrics
  const metrics: First90DaysMetrics | null = businessData ? {
    daysOpen,
    daysRemaining: Math.max(90 - daysOpen, 0),
    progressPercentage: Math.min((daysOpen / 90) * 100, 100),
    weekNumber,
    
    // B-23: TODAS las cifras salen del motor canónico (useAggregatedFinances),
    // el mismo que alimenta Finanzas y el Dashboard. Antes se leía solo
    // `daily_sales` (captura manual) y los % iban sobre ingreso bruto con IVA:
    // el mismo restaurante y el mismo rango daban números distintos según la
    // pantalla, y el copiloto IA aconsejaba sobre los que no cuadraban.
    totalRevenue: _fRevenue,
    averageDailyRevenue: _fRevenue / Math.max(daysOpen, 1),
    revenueGrowth: calculateWeeklyGrowth(canonicalDaily, 'total_revenue'),
    projectedMonthlyRevenue: (_fRevenue / Math.max(daysOpen, 1)) * 30,

    // Customer metrics
    totalCustomers: _fCustomers,
    averageDailyCustomers: _fCustomers / Math.max(daysOpen, 1),
    customerGrowth: calculateWeeklyGrowth(canonicalDaily, 'covers_count'),
    repeatCustomerRate: 0, // B-27 pendiente: requiere cruzar con fidelización

    // Operational metrics
    // Ingreso por comensal (no por orden): es lo que calculaba antes.
    averageTicket: canonicalKpis?.revenuePerCover ?? 0,
    ticketTrend: 'stable',
    peakDays: computePeakDays(canonicalDaily),
    peakHours: [], // B-27 pendiente: requiere agregación por hora desde restaurant_orders

    // Efficiency metrics — % sobre base NETA (sin IVA), igual que Finanzas.
    foodCostAverage: _fFoodPct,
    laborCostAverage: canonicalKpis?.laborCostPercentage ?? 0,
    wastageReduction: 0,
    
    // Milestones
    milestones: DEFAULT_MILESTONES.map((m, i) => {
      const done = evalMilestone(m);
      return {
        ...m,
        id: `milestone-${i}`,
        isCompleted: done,
        completedAt: done ? new Date().toISOString() : undefined,
      };
    }),
    
    // Weekly focus
    weeklyFocus: {
      weekNumber,
      ...(WEEKLY_FOCUSES[weekNumber] || WEEKLY_FOCUSES[1]),
    },
  } : null;

  return {
    isNewRestaurant,
    daysOpen,
    metrics,
    businessData,
    diagnosisData,
    isLoading: loadingBusiness,
  };
}

// Helper to calculate weekly growth
/**
 * B-27 — Días fuertes calculados desde la serie diaria real (ingreso por día de
 * la semana), no la lista fija ['Sábado','Viernes','Domingo'] que estaba escrita
 * a mano y se mostraba igual a todos los restaurantes.
 */
function computePeakDays(daily: Array<{ date: string; total_revenue: number }>): string[] {
  if (!daily?.length) return [];
  const DOW = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const byDow = new Map<number, number>();
  for (const d of daily) {
    // `date` es 'yyyy-MM-dd': se parsea como local para no correr el día por UTC.
    const [y, m, dd] = d.date.split('-').map(Number);
    const dow = new Date(y, (m || 1) - 1, dd || 1).getDay();
    byDow.set(dow, (byDow.get(dow) || 0) + (Number(d.total_revenue) || 0));
  }
  return [...byDow.entries()]
    .filter(([, revenue]) => revenue > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([dow]) => DOW[dow]);
}

function calculateWeeklyGrowth(data: any[], field: string): number[] {
  if (!data.length) return [];
  
  const weeklyData: number[] = [];
  const sortedData = [...data].sort((a, b) => 
    new Date(a.sale_date || a.date || 0).getTime() - new Date(b.sale_date || b.date || 0).getTime()
  );
  
  let weekSum = 0;
  let dayCount = 0;
  
  sortedData.forEach((entry, i) => {
    weekSum += entry[field] || 0;
    dayCount++;
    
    if (dayCount === 7 || i === sortedData.length - 1) {
      weeklyData.push(weekSum);
      weekSum = 0;
      dayCount = 0;
    }
  });
  
  return weeklyData;
}
