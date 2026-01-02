import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useConsultantProfile } from './useConsultantProfile';

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
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    try {
      // First get all client user IDs
      const { data: clients } = await supabase
        .from('consultant_clients')
        .select('client_user_id')
        .eq('consultant_id', profile.id)
        .in('status', ['active', 'prospect']);

      if (!clients || clients.length === 0) {
        setAlerts([]);
        setLoading(false);
        return;
      }

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

      setAlerts(enrichedAlerts);
    } catch (error: any) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('copilot_alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_read: true } : a));
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

      setAlerts(prev => prev.filter(a => a.id !== alertId));
      toast({ title: "Alerta resuelta" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchAlerts();
    }
  }, [profile?.id]);

  const highPriorityAlerts = alerts.filter(a => a.priority === 'high' || a.priority === 'critical');
  const unreadCount = alerts.filter(a => !a.is_read).length;

  return {
    alerts,
    highPriorityAlerts,
    unreadCount,
    loading,
    markAsRead,
    dismissAlert,
    refetch: fetchAlerts
  };
};
