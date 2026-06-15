import { createClient } from 'npm:@supabase/supabase-js@2';
import { generateText } from 'npm:ai';
import { createLovableAiGatewayProvider } from '../_shared/ai-gateway.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SuggestReq {
  user_id: string;
  current_items: { menu_item_id: string; name: string; quantity: number }[];
  guests?: number;
  time_of_day?: string; // breakfast|lunch|dinner
  max_suggestions?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = (await req.json()) as SuggestReq;
    if (!body?.user_id) {
      return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400, headers: corsHeaders });
    }
    const max = Math.min(Math.max(body.max_suggestions ?? 3, 1), 5);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1) Co-occurrence based on what's already in the order
    const currentIds = (body.current_items ?? []).map((i) => i.menu_item_id);
    let suggestions: { menu_item_id: string; name: string; reason: string; score: number }[] = [];

    if (currentIds.length > 0) {
      const { data: co } = await supabase
        .from('menu_item_cooccurrence')
        .select('item_a,item_b,name_a,name_b,pair_count')
        .eq('user_id', body.user_id)
        .or(currentIds.map((id) => `item_a.eq.${id},item_b.eq.${id}`).join(','))
        .order('pair_count', { ascending: false })
        .limit(20);

      const scoreMap = new Map<string, { name: string; score: number }>();
      for (const row of co ?? []) {
        const otherId = currentIds.includes(row.item_a) ? row.item_b : row.item_a;
        const otherName = currentIds.includes(row.item_a) ? row.name_b : row.name_a;
        if (currentIds.includes(otherId)) continue;
        const cur = scoreMap.get(otherId) ?? { name: otherName, score: 0 };
        cur.score += row.pair_count;
        scoreMap.set(otherId, cur);
      }
      suggestions = Array.from(scoreMap.entries())
        .map(([id, v]) => ({ menu_item_id: id, name: v.name, score: v.score, reason: 'Suelen pedirse juntos' }))
        .sort((a, b) => b.score - a.score)
        .slice(0, max);
    }

    // 2) Fallback to top-sellers if nothing co-occurring
    if (suggestions.length < max) {
      const { data: top } = await supabase
        .from('restaurant_orders')
        .select('items')
        .eq('user_id', body.user_id)
        .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
        .limit(200);
      const counter = new Map<string, { name: string; count: number }>();
      for (const o of top ?? []) {
        for (const it of (o.items as any[]) ?? []) {
          const id = it?.menu_item_id;
          if (!id || currentIds.includes(id) || suggestions.some((s) => s.menu_item_id === id)) continue;
          const c = counter.get(id) ?? { name: it.name, count: 0 };
          c.count += Number(it.quantity ?? 1);
          counter.set(id, c);
        }
      }
      const need = max - suggestions.length;
      const fallback = Array.from(counter.entries())
        .map(([id, v]) => ({ menu_item_id: id, name: v.name, score: v.count, reason: 'Top vendido este mes' }))
        .sort((a, b) => b.score - a.score)
        .slice(0, need);
      suggestions = suggestions.concat(fallback);
    }

    // 3) Optional AI persuasion copy
    let pitch: string | null = null;
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (apiKey && suggestions.length > 0) {
      try {
        const gateway = createLovableAiGatewayProvider(apiKey);
        const model = gateway('google/gemini-3-flash-preview');
        const itemsTxt = (body.current_items ?? []).map((i) => `${i.quantity}x ${i.name}`).join(', ') || '(comanda vacía)';
        const sugTxt = suggestions.map((s) => s.name).join(', ');
        const { text } = await generateText({
          model,
          system:
            'Eres un mesero experto que sugiere productos al cajero para upsell. Responde una sola frase corta en español, persuasiva pero natural, máx 80 caracteres. Sin emojis. SOLO menciona los productos exactos del input — no inventes ingredientes, precios ni promociones.',
          prompt: `Mesa pidió: ${itemsTxt}. Recomendar al cliente: ${sugTxt}.`,
        });
        pitch = text.trim().replace(/^["']|["']$/g, '');
      } catch (e) {
        console.warn('[pos-ai-suggest] AI pitch failed', e);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, suggestions, pitch }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('[pos-ai-suggest]', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: corsHeaders });
  }
});
