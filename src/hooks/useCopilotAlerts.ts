import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type CopilotAlert = Database['public']['Tables']['copilot_alerts']['Row'];

export const useCopilotAlerts = () => {
  const { userId } = useDataUserId();
  const queryClient = useQueryClient();

  // Fase 3.4 — Realtime push: nuevas alertas se reflejan al instante
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`copilot_alerts:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'copilot_alerts', filter: `user_id=eq.${userId}` },
        (payload) => {
          const a = payload.new as CopilotAlert;
          queryClient.invalidateQueries({ queryKey: ['copilot-alerts', userId] });
          const isHigh = a.priority === 'high' || a.priority === 'critical';
          toast(a.title, {
            description: a.message,
            duration: isHigh ? 8000 : 5000,
            className: isHigh ? 'border-destructive' : undefined,
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'copilot_alerts', filter: `user_id=eq.${userId}` },
        () => queryClient.invalidateQueries({ queryKey: ['copilot-alerts', userId] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  const { data: alerts = [], isLoading, refetch } = useQuery({
    queryKey: ['copilot-alerts', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('copilot_alerts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  const unreadAlerts = alerts.filter(a => !a.is_read);
  const highPriorityAlerts = alerts.filter(a => a.priority === 'high' || a.priority === 'critical');

  const markAsReadMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('copilot_alerts')
        .update({ is_read: true })
        .eq('id', alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['copilot-alerts', userId] });
    }
  });

  const dismissAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('copilot_alerts')
        .update({ is_dismissed: true })
        .eq('id', alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['copilot-alerts', userId] });
    }
  });

  const generateAlerts = async () => {
    if (!userId) return;
    try {
      await supabase.functions.invoke('ai-proactive-alerts', {
        body: { user_id: userId }
      });
      refetch();
    } catch (error) {
      console.error('Error generating alerts:', error);
    }
  };

  return {
    alerts,
    unreadAlerts,
    highPriorityAlerts,
    isLoading,
    markAsRead: markAsReadMutation.mutate,
    dismissAlert: dismissAlertMutation.mutate,
    generateAlerts,
    refetch
  };
};
