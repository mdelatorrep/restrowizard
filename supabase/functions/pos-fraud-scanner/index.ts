import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScanRequest {
  user_id: string;
  window_hours?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = (await req.json()) as ScanRequest;
    if (!body?.user_id) {
      return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400, headers: corsHeaders });
    }
    const windowHours = Math.min(Math.max(body.window_hours ?? 24, 1), 24 * 7);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const since = new Date(Date.now() - windowHours * 3600 * 1000).toISOString();
    const signals: any[] = [];

    // Signal 1: Excessive cancellations by actor
    const { data: cancels } = await supabase
      .from('pos_audit_log')
      .select('actor_user_id, amount, entity_id, created_at')
      .eq('user_id', body.user_id)
      .eq('action', 'cancel')
      .gte('created_at', since);

    const byActor = new Map<string, { count: number; total: number }>();
    for (const r of cancels ?? []) {
      const key = r.actor_user_id ?? 'unknown';
      const cur = byActor.get(key) ?? { count: 0, total: 0 };
      cur.count += 1;
      cur.total += Number(r.amount ?? 0);
      byActor.set(key, cur);
    }
    for (const [actor, agg] of byActor) {
      if (agg.count >= 5 || agg.total >= 200000) {
        signals.push({
          user_id: body.user_id,
          signal_type: 'excessive_cancellations',
          severity: agg.count >= 10 || agg.total >= 500000 ? 'high' : 'medium',
          actor_name: actor,
          amount: agg.total,
          score: agg.count,
          description: `${agg.count} cancelaciones por $${Math.round(agg.total).toLocaleString('es-CO')} en ${windowHours}h`,
          evidence: { count: agg.count, total: agg.total, window_hours: windowHours },
        });
      }
    }

    // Signal 2: Voids after payment
    const { data: voids } = await supabase
      .from('pos_audit_log')
      .select('actor_user_id, amount, entity_id, created_at')
      .eq('user_id', body.user_id)
      .in('action', ['voided', 'refunded'])
      .gte('created_at', since);

    if ((voids?.length ?? 0) >= 3) {
      const total = (voids ?? []).reduce((s, v) => s + Number(v.amount ?? 0), 0);
      signals.push({
        user_id: body.user_id,
        signal_type: 'voids_after_payment',
        severity: voids!.length >= 8 ? 'high' : 'medium',
        amount: total,
        score: voids!.length,
        description: `${voids!.length} anulaciones de pago en ${windowHours}h ($${Math.round(total).toLocaleString('es-CO')})`,
        evidence: { count: voids!.length, total, window_hours: windowHours },
      });
    }

    // Signal 3: High discount rate
    const { data: discounts } = await supabase
      .from('pos_audit_log')
      .select('actor_user_id, amount, created_at')
      .eq('user_id', body.user_id)
      .eq('action', 'discount_applied')
      .gte('created_at', since);

    const totalDiscount = (discounts ?? []).reduce((s, d) => s + Math.abs(Number(d.amount ?? 0)), 0);
    if (totalDiscount >= 300000) {
      signals.push({
        user_id: body.user_id,
        signal_type: 'high_discount_volume',
        severity: totalDiscount >= 1000000 ? 'high' : 'medium',
        amount: totalDiscount,
        score: discounts?.length ?? 0,
        description: `Descuentos por $${Math.round(totalDiscount).toLocaleString('es-CO')} en ${windowHours}h`,
        evidence: { count: discounts?.length ?? 0, total: totalDiscount, window_hours: windowHours },
      });
    }

    // Insert new signals (skip if recent duplicate of same type)
    const inserted: any[] = [];
    for (const sig of signals) {
      const { data: existing } = await supabase
        .from('pos_fraud_signals')
        .select('id')
        .eq('user_id', sig.user_id)
        .eq('signal_type', sig.signal_type)
        .eq('status', 'open')
        .gte('detected_at', since)
        .limit(1);
      if ((existing?.length ?? 0) > 0) continue;
      const { data, error } = await supabase.from('pos_fraud_signals').insert(sig).select().single();
      if (!error && data) inserted.push(data);
    }

    return new Response(
      JSON.stringify({ ok: true, signals_detected: signals.length, signals_inserted: inserted.length, inserted }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('[pos-fraud-scanner]', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: corsHeaders });
  }
});
