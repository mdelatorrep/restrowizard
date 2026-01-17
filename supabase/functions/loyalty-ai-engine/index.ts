import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LoyaltyCustomer {
  id: string;
  customer_name: string;
  current_points: number;
  lifetime_points: number;
  total_spent: number;
  total_orders: number;
  avg_order_value: number;
  first_order_at: string | null;
  last_order_at: string | null;
  churn_risk_score: number;
  preferred_items: string[];
  tier_name?: string;
}

interface RFMSegment {
  recency: 'recent' | 'moderate' | 'dormant';
  frequency: 'high' | 'medium' | 'low';
  monetary: 'high' | 'medium' | 'low';
  segment: string;
  action: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, customers, customer, config } = await req.json();

    let result;

    switch (action) {
      case 'segment_rfm':
        result = segmentCustomersRFM(customers);
        break;

      case 'predict_churn':
        result = predictChurnRisk(customers);
        break;

      case 'recommend_actions':
        result = recommendActions(customer, config);
        break;

      case 'calculate_ltv':
        result = calculatePredictiveLTV(customer);
        break;

      case 'personalize_offers':
        result = generatePersonalizedOffers(customer, config);
        break;

      case 'analyze_program':
        result = analyzeLoyaltyProgram(customers, config);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Loyalty AI Engine error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// RFM Segmentation
function segmentCustomersRFM(customers: LoyaltyCustomer[]): Record<string, RFMSegment> {
  const segments: Record<string, RFMSegment> = {};
  const now = new Date();

  for (const customer of customers) {
    // Calculate Recency (days since last order)
    const lastOrder = customer.last_order_at ? new Date(customer.last_order_at) : null;
    const daysSinceLastOrder = lastOrder 
      ? Math.floor((now.getTime() - lastOrder.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    let recency: RFMSegment['recency'];
    if (daysSinceLastOrder <= 30) recency = 'recent';
    else if (daysSinceLastOrder <= 90) recency = 'moderate';
    else recency = 'dormant';

    // Calculate Frequency
    let frequency: RFMSegment['frequency'];
    if (customer.total_orders >= 10) frequency = 'high';
    else if (customer.total_orders >= 3) frequency = 'medium';
    else frequency = 'low';

    // Calculate Monetary
    let monetary: RFMSegment['monetary'];
    if (customer.total_spent >= 50000) monetary = 'high';
    else if (customer.total_spent >= 15000) monetary = 'medium';
    else monetary = 'low';

    // Determine segment and action
    let segment: string;
    let action: string;

    if (recency === 'recent' && frequency === 'high' && monetary === 'high') {
      segment = 'Champions';
      action = 'Mantener con experiencias exclusivas y puntos VIP';
    } else if (recency === 'recent' && frequency === 'high') {
      segment = 'Loyal Customers';
      action = 'Upselling y programa de referidos';
    } else if (recency === 'recent' && monetary === 'high') {
      segment = 'Potential Loyalists';
      action = 'Incentivar frecuencia con puntos bonus';
    } else if (recency === 'moderate' && frequency === 'medium') {
      segment = 'Promising';
      action = 'Campaña de reactivación con oferta especial';
    } else if (recency === 'dormant' && frequency === 'high') {
      segment = 'At Risk';
      action = 'URGENTE: Campaña de recuperación con alto valor';
    } else if (recency === 'dormant' && monetary === 'high') {
      segment = 'Cant Lose Them';
      action = 'Contacto personal y oferta irresistible';
    } else if (recency === 'dormant') {
      segment = 'Hibernating';
      action = 'Campaña masiva de reactivación con descuento';
    } else if (frequency === 'low' && monetary === 'low') {
      segment = 'New/Low Value';
      action = 'Nurturing con contenido y primera oferta';
    } else {
      segment = 'Others';
      action = 'Monitorear y segmentar mejor';
    }

    segments[customer.id] = { recency, frequency, monetary, segment, action };
  }

  return segments;
}

// Churn Prediction
function predictChurnRisk(customers: LoyaltyCustomer[]): Record<string, { risk: number; factors: string[] }> {
  const predictions: Record<string, { risk: number; factors: string[] }> = {};
  const now = new Date();

  for (const customer of customers) {
    const factors: string[] = [];
    let riskScore = 0;

    // Days since last order
    const lastOrder = customer.last_order_at ? new Date(customer.last_order_at) : null;
    const daysSince = lastOrder 
      ? Math.floor((now.getTime() - lastOrder.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    if (daysSince > 60) {
      riskScore += 0.3;
      factors.push(`${daysSince} días sin comprar`);
    } else if (daysSince > 30) {
      riskScore += 0.15;
      factors.push('Más de 30 días sin comprar');
    }

    // Order frequency declining
    if (customer.total_orders > 0) {
      const firstOrder = customer.first_order_at ? new Date(customer.first_order_at) : now;
      const totalDays = Math.max(1, Math.floor((now.getTime() - firstOrder.getTime()) / (1000 * 60 * 60 * 24)));
      const expectedFrequency = totalDays / customer.total_orders;
      
      if (daysSince > expectedFrequency * 2) {
        riskScore += 0.25;
        factors.push('Frecuencia de compra en declive');
      }
    }

    // Low engagement (few orders)
    if (customer.total_orders <= 2) {
      riskScore += 0.2;
      factors.push('Bajo engagement histórico');
    }

    // No points activity
    if (customer.current_points === 0 && customer.lifetime_points > 0) {
      riskScore += 0.1;
      factors.push('Puntos canjeados sin nuevas compras');
    }

    // Accumulated but not redeeming
    if (customer.current_points > 500) {
      riskScore -= 0.1; // Actually good - they have incentive to return
    }

    predictions[customer.id] = {
      risk: Math.min(1, Math.max(0, riskScore)),
      factors,
    };
  }

  return predictions;
}

// Recommend Actions for a customer
function recommendActions(customer: LoyaltyCustomer, config: { tiers: unknown[]; catalog: unknown[] }): string[] {
  const actions: string[] = [];
  const now = new Date();
  const lastOrder = customer.last_order_at ? new Date(customer.last_order_at) : null;
  const daysSince = lastOrder 
    ? Math.floor((now.getTime() - lastOrder.getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  // Churn prevention
  if (daysSince > 45) {
    actions.push(`Enviar oferta de reactivación con ${Math.min(200, customer.lifetime_points * 0.1)} puntos bonus`);
  }

  // Upselling
  if (customer.avg_order_value < 20000 && customer.total_orders >= 3) {
    actions.push('Sugerir combo o producto premium para aumentar ticket');
  }

  // Points expiration reminder
  if (customer.current_points > 100) {
    actions.push(`Recordar ${customer.current_points} puntos disponibles para canjear`);
  }

  // Tier upgrade opportunity
  if (customer.lifetime_points > 800 && !customer.tier_name?.toLowerCase().includes('oro')) {
    actions.push('Notificar que está cerca del siguiente nivel');
  }

  // Referral program
  if (customer.total_orders >= 5) {
    actions.push('Invitar al programa de referidos con bonus de 100 puntos');
  }

  // Review request
  if (customer.total_orders >= 3 && daysSince < 7) {
    actions.push('Solicitar reseña a cambio de puntos bonus');
  }

  return actions.slice(0, 5);
}

// Calculate Predictive LTV
function calculatePredictiveLTV(customer: LoyaltyCustomer): { ltv12m: number; ltv24m: number; factors: string[] } {
  const factors: string[] = [];
  
  // Base: Current total spent
  let baseValue = customer.total_spent;
  
  // Calculate average order frequency
  const now = new Date();
  const firstOrder = customer.first_order_at ? new Date(customer.first_order_at) : now;
  const totalDays = Math.max(1, Math.floor((now.getTime() - firstOrder.getTime()) / (1000 * 60 * 60 * 24)));
  const ordersPerYear = (customer.total_orders / totalDays) * 365;
  
  factors.push(`${ordersPerYear.toFixed(1)} órdenes proyectadas/año`);
  
  // Project 12-month LTV
  let ltv12m = ordersPerYear * customer.avg_order_value;
  
  // Adjust for loyalty program engagement
  if (customer.lifetime_points > 500) {
    ltv12m *= 1.15; // 15% boost for engaged members
    factors.push('+15% por engagement en programa');
  }
  
  // Adjust for churn risk
  if (customer.churn_risk_score > 0.5) {
    ltv12m *= (1 - customer.churn_risk_score * 0.5);
    factors.push(`-${Math.round(customer.churn_risk_score * 50)}% por riesgo de abandono`);
  }
  
  // 24-month projection with retention decay
  const ltv24m = ltv12m * 1.7; // Not quite double due to natural attrition
  
  return {
    ltv12m: Math.round(ltv12m),
    ltv24m: Math.round(ltv24m),
    factors,
  };
}

// Generate Personalized Offers
function generatePersonalizedOffers(
  customer: LoyaltyCustomer, 
  config: { catalog: { name: string; points_required: number; reward_type: string }[] }
): { offer: string; reason: string; points_cost: number }[] {
  const offers: { offer: string; reason: string; points_cost: number }[] = [];
  
  // Based on points balance
  if (customer.current_points >= 100) {
    const affordableRewards = config.catalog?.filter(r => r.points_required <= customer.current_points) || [];
    if (affordableRewards.length > 0) {
      const bestReward = affordableRewards[Math.floor(Math.random() * affordableRewards.length)];
      offers.push({
        offer: `Canjea: ${bestReward.name}`,
        reason: 'Tienes suficientes puntos',
        points_cost: bestReward.points_required,
      });
    }
  }
  
  // Based on purchase history
  if (customer.avg_order_value > 15000) {
    offers.push({
      offer: 'Puntos dobles en tu próxima compra',
      reason: 'Cliente de alto valor',
      points_cost: 0,
    });
  }
  
  // Recovery offer for at-risk
  if (customer.churn_risk_score > 0.5) {
    offers.push({
      offer: '50 puntos bonus si compras esta semana',
      reason: 'Te extrañamos',
      points_cost: -50, // Negative = restaurant gives points
    });
  }
  
  // Preferred items
  if (customer.preferred_items?.length > 0) {
    offers.push({
      offer: `10% extra en ${customer.preferred_items[0]}`,
      reason: 'Tu favorito',
      points_cost: 50,
    });
  }
  
  return offers.slice(0, 3);
}

// Analyze overall loyalty program
function analyzeLoyaltyProgram(
  customers: LoyaltyCustomer[],
  config: { tiers: unknown[]; catalog: unknown[] }
): {
  health_score: number;
  insights: string[];
  recommendations: string[];
  metrics: Record<string, number>;
} {
  const insights: string[] = [];
  const recommendations: string[] = [];
  
  // Calculate metrics
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => {
    const lastOrder = c.last_order_at ? new Date(c.last_order_at) : null;
    if (!lastOrder) return false;
    const daysSince = Math.floor((Date.now() - lastOrder.getTime()) / (1000 * 60 * 60 * 24));
    return daysSince <= 90;
  }).length;
  
  const totalPoints = customers.reduce((sum, c) => sum + c.current_points, 0);
  const avgPoints = totalCustomers > 0 ? totalPoints / totalCustomers : 0;
  const atRiskCount = customers.filter(c => c.churn_risk_score >= 0.5).length;
  const totalLTV = customers.reduce((sum, c) => sum + c.total_spent, 0);
  const avgLTV = totalCustomers > 0 ? totalLTV / totalCustomers : 0;
  
  // Calculate health score (0-100)
  let healthScore = 50;
  
  // Active rate bonus
  const activeRate = totalCustomers > 0 ? activeCustomers / totalCustomers : 0;
  healthScore += activeRate * 20;
  if (activeRate < 0.3) insights.push('Tasa de actividad baja: menos del 30% de clientes activos');
  
  // At-risk penalty
  const atRiskRate = totalCustomers > 0 ? atRiskCount / totalCustomers : 0;
  healthScore -= atRiskRate * 15;
  if (atRiskRate > 0.2) insights.push(`${atRiskCount} clientes en riesgo de abandono`);
  
  // Points engagement
  if (avgPoints > 200) {
    healthScore += 10;
    insights.push('Buen engagement: clientes acumulando puntos');
  } else if (avgPoints < 50) {
    healthScore -= 5;
    insights.push('Bajo engagement con el sistema de puntos');
    recommendations.push('Aumentar puntos por compra o crear campañas de puntos bonus');
  }
  
  // Recommendations based on analysis
  if (activeRate < 0.5) {
    recommendations.push('Lanzar campaña de reactivación con puntos dobles');
  }
  if (atRiskCount > 5) {
    recommendations.push(`Priorizar recuperación de ${atRiskCount} clientes en riesgo`);
  }
  if (totalPoints > 10000) {
    recommendations.push('Considerar promoción de canje para reducir liability de puntos');
  }
  
  return {
    health_score: Math.round(Math.min(100, Math.max(0, healthScore))),
    insights,
    recommendations,
    metrics: {
      total_customers: totalCustomers,
      active_customers: activeCustomers,
      active_rate: Math.round(activeRate * 100),
      at_risk_count: atRiskCount,
      at_risk_rate: Math.round(atRiskRate * 100),
      total_points_circulating: totalPoints,
      avg_points_per_customer: Math.round(avgPoints),
      avg_ltv: Math.round(avgLTV),
    },
  };
}
