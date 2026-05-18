import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAIGateway, safeParseJson } from "../_shared/ai-gateway.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertData {
  user_id: string;
  alert_type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  data?: Record<string, unknown>;
  action_url?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    // LOVABLE_API_KEY handled by callAIGateway

    const { user_id, analysis_type } = await req.json();

    if (!user_id) {
      throw new Error('user_id is required');
    }

    const alerts: AlertData[] = [];

    // 1. Check Inventory Levels
    const { data: inventory } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', user_id);

    if (inventory) {
      for (const item of inventory) {
        if (item.current_stock <= (item.reorder_point || 0)) {
          alerts.push({
            user_id,
            alert_type: 'inventory_low',
            title: `Stock bajo: ${item.item_name}`,
            message: `Solo quedan ${item.current_stock} ${item.unit} de ${item.item_name}. El punto de reorden es ${item.reorder_point}.`,
            priority: item.current_stock <= (item.reorder_point || 0) / 2 ? 'critical' : 'high',
            data: { item_id: item.id, current_stock: item.current_stock, reorder_point: item.reorder_point },
            action_url: '/r/menu-engineering'
          });
        }
      }
    }

    // 2. Check Food Waste Trends
    const { data: wasteData } = await supabase
      .from('food_waste_logs')
      .select('*')
      .eq('user_id', user_id)
      .gte('waste_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    if (wasteData && wasteData.length > 0) {
      const totalWaste = wasteData.reduce((sum, w) => sum + (w.quantity_kg || 0), 0);
      const preventableWaste = wasteData.filter(w => w.preventable).reduce((sum, w) => sum + (w.quantity_kg || 0), 0);
      
      if (preventableWaste > totalWaste * 0.3) {
        alerts.push({
          user_id,
          alert_type: 'waste_high',
          title: 'Alto desperdicio prevenible',
          message: `El ${Math.round(preventableWaste / totalWaste * 100)}% del desperdicio de esta semana fue prevenible. Revisa los procesos de almacenamiento y preparación.`,
          priority: 'medium',
          data: { total_waste: totalWaste, preventable: preventableWaste },
          action_url: '/r/sustainability'
        });
      }
    }

    // 3. Check Daily Sales Trends
    const { data: salesData } = await supabase
      .from('daily_sales')
      .select('*')
      .eq('user_id', user_id)
      .order('sale_date', { ascending: false })
      .limit(14);

    if (salesData && salesData.length >= 7) {
      const thisWeek = salesData.slice(0, 7);
      const lastWeek = salesData.slice(7, 14);
      
      const thisWeekRevenue = thisWeek.reduce((sum, s) => sum + (s.total_revenue || 0), 0);
      const lastWeekRevenue = lastWeek.reduce((sum, s) => sum + (s.total_revenue || 0), 0);
      
      if (lastWeekRevenue > 0) {
        const changePercent = ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100;
        
        if (changePercent < -10) {
          alerts.push({
            user_id,
            alert_type: 'revenue_decrease',
            title: 'Ventas en descenso',
            message: `Las ventas de esta semana bajaron ${Math.abs(changePercent).toFixed(1)}% comparado con la semana anterior.`,
            priority: changePercent < -20 ? 'high' : 'medium',
            data: { this_week: thisWeekRevenue, last_week: lastWeekRevenue, change: changePercent },
            action_url: '/r/finances'
          });
        } else if (changePercent > 15) {
          alerts.push({
            user_id,
            alert_type: 'revenue_increase',
            title: '¡Excelente semana de ventas!',
            message: `Las ventas aumentaron ${changePercent.toFixed(1)}% esta semana. Analiza qué funcionó para replicarlo.`,
            priority: 'low',
            data: { this_week: thisWeekRevenue, last_week: lastWeekRevenue, change: changePercent },
            action_url: '/r/finances'
          });
        }
      }

      // Check food cost trend
      const avgFoodCost = thisWeek.reduce((sum, s) => sum + (s.food_cost || 0), 0) / thisWeek.length;
      const avgRevenue = thisWeekRevenue / thisWeek.length;
      
      if (avgRevenue > 0) {
        const foodCostPercent = (avgFoodCost / avgRevenue) * 100;
        
        if (foodCostPercent > 35) {
          alerts.push({
            user_id,
            alert_type: 'food_cost_high',
            title: 'Food cost por encima del objetivo',
            message: `Tu food cost promedio es ${foodCostPercent.toFixed(1)}%. El benchmark de la industria es 28-32%. Revisa precios y proveedores.`,
            priority: foodCostPercent > 40 ? 'high' : 'medium',
            data: { food_cost_percent: foodCostPercent },
            action_url: '/r/finances'
          });
        }
      }
    }

    // 4. Generate AI-powered insights with Lovable AI Gateway
    if (salesData && salesData.length > 0) {
      try {
        const aiResult = await callAIGateway({
          messages: [
            {
              role: "system",
              content:
                `Eres un analista de restaurantes. Analiza los datos y genera UNA alerta de oportunidad de negocio en español basada en tendencias actuales.
Responde SOLO con un JSON: {"title": "...", "message": "...", "priority": "low|medium"}`,
            },
            {
              role: "user",
              content: `Datos de ventas últimos 7 días: ${JSON.stringify(salesData.slice(0, 7))}`,
            },
          ],
          tier: "cheap",
          maxTokens: 300,
          jsonMode: true,
          logPrefix: "[ai-proactive-alerts]",
        });
        if (aiResult.ok) {
          const insight = safeParseJson<{ title?: string; message?: string; priority?: string }>(
            aiResult.content,
          );
          if (insight) {
            alerts.push({
              user_id,
              alert_type: "ai_opportunity",
              title: insight.title || "Oportunidad detectada",
              message: insight.message || "Revisa tus datos para más detalles",
              priority: insight.priority || "low",
              action_url: "/r/dashboard",
            });
          }
        }
      } catch (e) {
        console.error("AI analysis error:", e);
      }
    }

    // 5. Save alerts to database
    if (alerts.length > 0) {
      for (const alert of alerts) {
        await supabase
          .from('copilot_alerts')
          .upsert({
            user_id: alert.user_id,
            alert_type: alert.alert_type,
            title: alert.title,
            message: alert.message,
            priority: alert.priority,
            data: alert.data || {},
            action_url: alert.action_url,
            is_read: false,
            is_dismissed: false,
          }, {
            onConflict: 'user_id,alert_type',
            ignoreDuplicates: false
          });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      alerts_generated: alerts.length,
      alerts 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Proactive alerts error:', error);
    return new Response(JSON.stringify({ error: error.message, success: false }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
