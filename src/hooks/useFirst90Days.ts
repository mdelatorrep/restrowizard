import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { differenceInDays } from 'date-fns';

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
        .single();
      
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

  const { data: financeData } = useQuery({
    queryKey: ['first90-finances', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_sales')
        .select('*')
        .eq('user_id', user!.id)
        .order('date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Calculate if restaurant is within first 90 days
  const isNewRestaurant = businessData 
    ? differenceInDays(new Date(), new Date(businessData.created_at)) <= 90
    : false;

  const daysOpen = businessData 
    ? differenceInDays(new Date(), new Date(businessData.created_at))
    : 0;

  const weekNumber = Math.min(Math.ceil(daysOpen / 7), 13);

  // Build metrics
  const metrics: First90DaysMetrics | null = businessData ? {
    daysOpen,
    daysRemaining: Math.max(90 - daysOpen, 0),
    progressPercentage: Math.min((daysOpen / 90) * 100, 100),
    weekNumber,
    
    // Revenue metrics (from finance data or defaults)
    totalRevenue: financeData?.reduce((sum, e) => sum + (e.total_revenue || 0), 0) || 0,
    averageDailyRevenue: financeData?.length 
      ? financeData.reduce((sum, e) => sum + (e.total_revenue || 0), 0) / Math.max(daysOpen, 1)
      : 0,
    revenueGrowth: calculateWeeklyGrowth(financeData || [], 'total_revenue'),
    projectedMonthlyRevenue: financeData?.length
      ? (financeData.reduce((sum, e) => sum + (e.total_revenue || 0), 0) / Math.max(daysOpen, 1)) * 30
      : 0,
    
    // Customer metrics
    totalCustomers: financeData?.reduce((sum, e) => sum + (e.covers_count || 0), 0) || 0,
    averageDailyCustomers: financeData?.length
      ? financeData.reduce((sum, e) => sum + (e.covers_count || 0), 0) / Math.max(daysOpen, 1)
      : 0,
    customerGrowth: calculateWeeklyGrowth(financeData || [], 'covers_count'),
    repeatCustomerRate: 0, // Would need loyalty data
    
    // Operational metrics
    averageTicket: financeData?.length
      ? financeData.reduce((sum, e) => sum + (e.total_revenue || 0), 0) / 
        Math.max(financeData.reduce((sum, e) => sum + (e.covers_count || 0), 0), 1)
      : 0,
    ticketTrend: 'stable',
    peakDays: ['Sábado', 'Viernes', 'Domingo'],
    peakHours: ['14:00', '20:00', '21:00'],
    
    // Efficiency metrics - calculate percentage from absolute values
    foodCostAverage: financeData?.length && financeData.reduce((sum, e) => sum + (e.total_revenue || 0), 0) > 0
      ? (financeData.reduce((sum, e) => sum + (e.food_cost || 0), 0) / financeData.reduce((sum, e) => sum + (e.total_revenue || 0), 0)) * 100
      : 0,
    laborCostAverage: financeData?.length && financeData.reduce((sum, e) => sum + (e.total_revenue || 0), 0) > 0
      ? (financeData.reduce((sum, e) => sum + (e.labor_cost || 0), 0) / financeData.reduce((sum, e) => sum + (e.total_revenue || 0), 0)) * 100
      : 0,
    wastageReduction: 0,
    
    // Milestones
    milestones: DEFAULT_MILESTONES.map((m, i) => ({
      ...m,
      id: `milestone-${i}`,
      isCompleted: daysOpen >= m.targetDay,
      completedAt: daysOpen >= m.targetDay ? new Date().toISOString() : undefined,
    })),
    
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
function calculateWeeklyGrowth(data: any[], field: string): number[] {
  if (!data.length) return [];
  
  const weeklyData: number[] = [];
  const sortedData = [...data].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
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
