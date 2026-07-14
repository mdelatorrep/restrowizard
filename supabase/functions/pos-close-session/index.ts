import { createClient } from 'npm:@supabase/supabase-js@2';
import { generateText } from 'npm:ai';
import { createLovableAiGatewayProvider } from '../_shared/ai-gateway.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CloseReq {
  user_id: string;
  session_id: string;
  actual_cash: number;
  notes?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const body = (await req.json()) as CloseReq;
    if (!body?.user_id || !body?.session_id) {
      return new Response(JSON.stringify({ error: 'user_id and session_id required' }), { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: session, error: sErr } = await supabase
      .from('pos_sessions')
      .select('*')
      .eq('id', body.session_id)
      .eq('user_id', body.user_id)
      .maybeSingle();
    if (sErr || !session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), { status: 404, headers: corsHeaders });
    }

    const startedAt = session.opened_at ?? session.created_at;

    // Aggregate sales for this session
    const { data: orders } = await supabase
      .from('restaurant_orders')
      .select('total,items,payment_method,status,created_at,source')
      .eq('user_id', body.user_id)
      .eq('source', 'in_store')
      .gte('created_at', startedAt)
      .lte('created_at', new Date().toISOString())
      .neq('status', 'cancelled');

    const totalSales = (orders ?? []).reduce((s, o) => s + Number(o.total ?? 0), 0);
    const orderCount = orders?.length ?? 0;

    const paymentBreakdown: Record<string, number> = {};
    const itemCount = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const o of orders ?? []) {
      const pm = (o.payment_method ?? 'otro').toString().toLowerCase();
      paymentBreakdown[pm] = (paymentBreakdown[pm] ?? 0) + Number(o.total ?? 0);
      for (const it of (o.items as any[]) ?? []) {
        const key = it?.menu_item_id ?? it?.name ?? 'x';
        const cur = itemCount.get(key) ?? { name: it.name ?? 'Item', qty: 0, revenue: 0 };
        cur.qty += Number(it.quantity ?? 1);
        cur.revenue += Number(it.price ?? 0) * Number(it.quantity ?? 1);
        itemCount.set(key, cur);
      }
    }
    const topItems = Array.from(itemCount.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const expectedCash = Number(session.opening_cash ?? 0) + (paymentBreakdown['efectivo'] ?? 0) + (paymentBreakdown['cash'] ?? 0);
    const cashDifference = body.actual_cash - expectedCash;

    // Audit summary for the session window
    const { data: audit } = await supabase
      .from('pos_audit_log')
      .select('action,amount')
      .eq('user_id', body.user_id)
      .gte('created_at', startedAt);

    const auditSummary: Record<string, { count: number; total: number }> = {};
    for (const a of audit ?? []) {
      const k = a.action;
      const cur = auditSummary[k] ?? { count: 0, total: 0 };
      cur.count += 1;
      cur.total += Number(a.amount ?? 0);
      auditSummary[k] = cur;
    }

    // AI summary
    let aiSummary = '';
    let aiRecommendations: string[] = [];
    const key = Deno.env.get('LOVABLE_API_KEY');
    if (key) {
      try {
        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway('google/gemini-3-flash-preview');
        const ctx = {
          totalSales,
          orderCount,
          paymentBreakdown,
          topItems: topItems.map((t) => `${t.name} (${t.qty}u $${Math.round(t.revenue)})`),
          cashDifference,
          cancellations: auditSummary['cancel']?.count ?? 0,
          discounts: auditSummary['discount_applied']?.total ?? 0,
          voids: auditSummary['voided']?.count ?? 0,
        };
        const { text } = await generateText({
          model,
          system:
            'Eres un supervisor de POS. Genera resumen ejecutivo del cierre de turno en español. Devuelve JSON: {"summary":"...", "recommendations":["...","..."]}. Resumen max 3 líneas, recomendaciones max 3 ítems accionables.',
          prompt: `Datos: ${JSON.stringify(ctx)}`,
        });
        const cleaned = text.replace(/```json\s*|\s*```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        aiSummary = parsed.summary ?? '';
        aiRecommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
      } catch (e) {
        console.warn('[pos-close-session] AI failed', e);
      }
    }

    // Persist closure
    const { data: closure, error: cErr } = await supabase
      .from('pos_session_closures')
      .insert({
        user_id: body.user_id,
        session_id: body.session_id,
        cashier_name: session.cashier_name,
        opened_at: startedAt,
        opening_cash: session.opening_cash ?? 0,
        expected_cash: expectedCash,
        actual_cash: body.actual_cash,
        cash_difference: cashDifference,
        total_sales: totalSales,
        order_count: orderCount,
        payment_breakdown: paymentBreakdown,
        top_items: topItems,
        audit_summary: auditSummary,
        ai_summary: aiSummary,
        ai_recommendations: aiRecommendations,
        notes: body.notes ?? null,
      })
      .select()
      .single();

    if (cErr) {
      return new Response(JSON.stringify({ error: cErr.message }), { status: 500, headers: corsHeaders });
    }

    // Update session to closed
    await supabase
      .from('pos_sessions')
      .update({
        status: 'closed',
        actual_cash: body.actual_cash,
        closing_cash: body.actual_cash,
        expected_cash: expectedCash,
        difference: cashDifference,
        closed_at: new Date().toISOString(),
        notes: body.notes ?? null,
      })
      .eq('id', body.session_id);

    return new Response(
      JSON.stringify({ ok: true, closure }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('[pos-close-session]', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: corsHeaders });
  }
});
