import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';
import { Database } from '@/integrations/supabase/types';

type CopilotAlert = Database['public']['Tables']['copilot_alerts']['Row'];

export const useCopilotAlerts = () => {
  const { userId } = useDataUserId();
  const queryClient = useQueryClient();

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
