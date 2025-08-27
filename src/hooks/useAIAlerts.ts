import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { usePushNotifications } from './usePushNotifications';

interface AIAlert {
  type: 'cost_increase' | 'inventory_low' | 'kpi_threshold' | 'opportunity';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  data?: any;
}

export const useAIAlerts = () => {
  const { user } = useAuth();
  const { isSubscribed } = usePushNotifications();

  const sendAIAlert = async (alert: AIAlert) => {
    if (!user || !isSubscribed) return;

    try {
      console.log('🤖 Sending AI Alert:', alert);

      const notificationData = {
        userId: user.id,
        title: `🧙‍♂️ ${alert.title}`,
        body: alert.message,
        notificationType: alert.type,
        actionUrl: '/dashboard',
        data: alert.data || {}
      };

      await supabase.functions.invoke('send-push-notification', {
        body: notificationData
      });

      console.log('✅ AI Alert sent successfully');
    } catch (error) {
      console.error('❌ Error sending AI alert:', error);
    }
  };

  // Simulate AI alerts based on mock data conditions
  useEffect(() => {
    if (!user || !isSubscribed) return;

    const checkAlerts = () => {
      // Simulate cost increase alert
      const costAlert: AIAlert = {
        type: 'cost_increase',
        title: 'Alerta de Costos',
        message: 'El costo de la carne de res ha subido un 12%. Considera ajustar precios o negociar con proveedores.',
        severity: 'high',
        data: { ingredient: 'carne_res', increase: 12 }
      };

      // Simulate inventory alert
      const inventoryAlert: AIAlert = {
        type: 'inventory_low',
        title: 'Inventario Crítico',
        message: 'Los tomates están en nivel crítico (5kg). Programa un pedido urgente.',
        severity: 'critical',
        data: { item: 'tomates', stock: 5, reorderPoint: 10 }
      };

      // Simulate opportunity alert
      const opportunityAlert: AIAlert = {
        type: 'opportunity',
        title: 'Oportunidad de Negocio',
        message: 'El Ajiaco Santafereño tiene alta rentabilidad y ventas. Considera promocionarlo.',
        severity: 'medium',
        data: { dish: 'ajiaco', profitMargin: 78, sales: 'high' }
      };

      // Send alerts randomly for demo purposes
      const alerts = [costAlert, inventoryAlert, opportunityAlert];
      const randomAlert = alerts[Math.floor(Math.random() * alerts.length)];
      
      // Send alert after random delay (demo purposes only)
      setTimeout(() => {
        sendAIAlert(randomAlert);
      }, Math.random() * 60000 + 30000); // Between 30s and 90s
    };

    // Check for alerts periodically (in real app, this would be triggered by actual data changes)
    const interval = setInterval(checkAlerts, 120000); // Check every 2 minutes

    return () => clearInterval(interval);
  }, [user, isSubscribed]);

  return {
    sendAIAlert
  };
};