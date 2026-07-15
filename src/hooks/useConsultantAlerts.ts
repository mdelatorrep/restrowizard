import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useConsultantProfile } from './useConsultantProfile';
import { qk } from '@/lib/queryKeys';

interface Alert {
  id: string;
  user_id: string;
  alert_type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  is_read: boolean | null;
  is_dismissed: boolean | null;
  action_url: string | null;
  data: any;
  created_at: string;
  // Joined data
  client_name?: string;
  business_name?: string;
}

export const useConsultantAlerts = () => {
  const { profile } = useConsultantProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading: loading } = useQuery({
    queryKey: qk.consultant.alerts(profile?.id),
    enabled: !!profile?.id,
    queryFn: async (): Promise<Alert[]> => {
      // First get all client user IDs
      const { data: clients } = await supabase
        .from('consultant_clients')
        .select('client_user_id')
        .eq('consultant_id', profile!.id)
        .in('status', ['active', 'prospect']);

      if (!clients || clients.length === 0) return [];

      const clientUserIds = clients.map(c => c.client_user_id);

      // Get alerts for all clients
      const { data: alertsData, error } = await supabase
        .from('copilot_alerts')
        .select('*')
        .in('user_id', clientUserIds)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Enrich with client/business info
      const enrichedAlerts = await Promise.all(
        (alertsData || []).map(async (alert) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', alert.user_id)
            .single();

          const { data: businessData } = await supabase
            .from('restaurant_businesses')
            .select('name')
            .eq('owner_id', alert.user_id)
            .single();

          return {
            ...alert,
            client_name: profileData?.full_name || 'Cliente',
            business_name: businessData?.name || 'Restaurante'
          };
        })
      );

      return enrichedAlerts as Alert[];
    },
  });

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: qk.consultant.alerts(profile?.id) }),
    [queryClient, profile?.id]
  );

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('copilot_alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (error) throw error;

      await invalidate();
    } catch (error: any) {
      console.error('Error marking alert as read:', error);
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('copilot_alerts')
        .update({ is_dismissed: true })
        .eq('id', alertId);

      if (error) throw error;

      await invalidate();
      toast({ title: "Alerta resuelta" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const highPriorityAlerts = alerts.filter(a => a.priority === 'high' || a.priority === 'critical');
  const unreadCount = alerts.filter(a => !a.is_read).length;

  return {
    alerts,
    highPriorityAlerts,
    unreadCount,
    loading,
    markAsRead,
    dismissAlert,
    refetch: invalidate
  };
};
