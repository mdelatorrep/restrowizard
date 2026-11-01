import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from '@/hooks/useDataUserId';
import { useToast } from '@/hooks/use-toast';
import { useAggregatedFinances } from '@/hooks/useAggregatedFinances';
import { addBusinessDays, todayBusinessDay } from '@/lib/businessDay';
import {
  buildMoments, slowestWeekday,
  type BusinessContext, type Channel, type DemandEventRow, type MenuOpportunity,
} from '@/lib/marketing/contentGenerator';

const db = supabase as any;

export interface MarketingContentRow {
  id: string;
  moment_date: string;
  moment_title: string;
  channel: Channel;
  title: string | null;
  body: string;
  publish_at: string | null;
  status: 'draft' | 'scheduled' | 'published' | 'discarded';
  menu_item_ids: string[];
  offer: Record<string, unknown> | null;
}

export const useMarketing = () => {
  const { userId, isResolved } = useDataUserId();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const today = todayBusinessDay();
  const enabled = !!userId && isResolved;

  const opportunities = useQuery({
    queryKey: ['marketing', userId, 'opportunities'],
    enabled,
    queryFn: async (): Promise<{ items: MenuOpportunity[]; margin_threshold: number; popularity_threshold: number; days: number }> => {
      const { data, error } = await db.rpc('marketing_menu_opportunities', { p_owner: userId, p_days: 28 });
      if (error) throw error;
      return data;
    },
  });

  const context = useQuery({
    queryKey: ['marketing', userId, 'context'],
    enabled,
    queryFn: async () => {
      const [biz, site, events] = await Promise.all([
        db.from('restaurant_businesses').select('name, city, address').eq('owner_id', userId).order('created_at').limit(1).maybeSingle(),
        db.from('restaurant_websites').select('slug, is_published, show_reservations').eq('user_id', userId).maybeSingle(),
        db.from('demand_events').select('id, event_date, start_time, title, category, expected_lift')
          .eq('user_id', userId).gte('event_date', today).lte('event_date', addBusinessDays(today, 44))
          .order('event_date').order('start_time'),
      ]);
      if (events.error) throw events.error;
      const reservationUrl = site.data?.slug && site.data.is_published && site.data.show_reservations
        ? `${window.location.origin}/p/${site.data.slug}/reservas` : null;
      const ctx: BusinessContext = {
        restaurantName: biz.data?.name || 'nuestro restaurante',
        city: biz.data?.city || null,
        // address puede ser el barrio ("Laureles") o una dirección completa: solo se usa si es corta.
        neighborhood: biz.data?.address && biz.data.address.length <= 24 && !/\d/.test(biz.data.address) ? biz.data.address : null,
        reservationUrl,
      };
      return { ctx, events: (events.data || []) as DemandEventRow[] };
    },
  });

  // Últimas 8 semanas para encontrar el día más flojo.
  const history = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 56);
    end.setDate(end.getDate() - 1);
    return { start, end };
  }, []);
  const { dailySales } = useAggregatedFinances(history);

  const content = useQuery({
    queryKey: ['marketing', userId, 'content'],
    enabled,
    queryFn: async (): Promise<MarketingContentRow[]> => {
      const { data, error } = await db.from('marketing_content').select('*').eq('user_id', userId)
        .gte('moment_date', addBusinessDays(today, -7)).neq('status', 'discarded')
        .order('moment_date').order('publish_at');
      if (error) throw error;
      return data || [];
    },
  });

  const items = opportunities.data?.items ?? [];
  const hasBrunch = items.some(i => /brunch/i.test(i.category));
  const slowDay = useMemo(() => slowestWeekday(dailySales.map(d => ({ date: d.date, total_revenue: d.total_revenue }))), [dailySales]);
  const moments = useMemo(
    () => buildMoments(context.data?.events ?? [], today, slowDay, 14, hasBrunch),
    [context.data?.events, today, slowDay, hasBrunch],
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['marketing', userId, 'content'] });

  const savePieces = useMutation({
    mutationFn: async (rows: Omit<MarketingContentRow, 'id' | 'status'>[]) => {
      const { error } = await db.from('marketing_content').insert(rows.map(r => ({
        ...r, user_id: userId, status: 'scheduled',
        // publishAt viene en hora de Bogotá sin zona: se guarda con su offset.
        publish_at: r.publish_at ? `${r.publish_at}:00-05:00` : null,
      })));
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: 'Contenido programado', description: 'Quedó en el calendario de contenido.' }); },
    onError: (e: any) => toast({ title: 'No se pudo guardar', description: e?.message, variant: 'destructive' }),
  });

  const invalidateContext = () => {
    queryClient.invalidateQueries({ queryKey: ['marketing', userId, 'context'] });
    // El generador de horarios también usa el calendario.
    queryClient.invalidateQueries({ queryKey: ['demand-events'] });
  };

  const addEvent = useMutation({
    mutationFn: async (e: { event_date: string; start_time: string | null; title: string; category: string; expected_lift: number }) => {
      const { error } = await db.from('demand_events').insert({ ...e, title: e.title.trim(), user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => { invalidateContext(); toast({ title: 'Evento agregado al calendario' }); },
    onError: (e: any) => toast({ title: 'No se pudo agregar', description: e?.message, variant: 'destructive' }),
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('demand_events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateContext,
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: MarketingContentRow['status'] }) => {
      const { error } = await db.from('marketing_content').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    loading: opportunities.isLoading || context.isLoading,
    error: (opportunities.error || context.error) as Error | null,
    items,
    marginThreshold: opportunities.data?.margin_threshold ?? 0,
    days: opportunities.data?.days ?? 28,
    ctx: context.data?.ctx ?? { restaurantName: '' },
    moments,
    slowDay,
    content: content.data ?? [],
    events: context.data?.events ?? [],
    addEvent,
    deleteEvent,
    savePieces,
    setStatus,
  };
};
