import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/components/ui/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type NotificationPermission = 'default' | 'granted' | 'denied';
export type PushSubscriptionDB = Tables<'push_subscriptions'>;
export type NotificationPreferencesDB = Tables<'notification_preferences'>;

export const usePushNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<PushSubscriptionDB[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferencesDB | null>(null);

  useEffect(() => {
    checkNotificationSupport();
    if (user) {
      loadSubscriptions();
      loadPreferences();
    }
  }, [user]);

  const checkNotificationSupport = () => {
    if (!('Notification' in window)) {
      console.log('❌ Browser does not support notifications');
      return false;
    }

    if (!('serviceWorker' in navigator)) {
      console.log('❌ Browser does not support service workers');
      return false;
    }

    setPermission(Notification.permission as NotificationPermission);
    return true;
  };

  const loadSubscriptions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      setSubscriptions(data || []);
      setIsSubscribed(data && data.length > 0);
    } catch (error) {
      console.error('❌ Error loading subscriptions:', error);
    }
  };

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      setPreferences(data);
    } catch (error) {
      console.error('❌ Error loading preferences:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!checkNotificationSupport()) return false;

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission as NotificationPermission);
      
      if (permission === 'granted') {
        toast({
          title: "✅ Notificaciones activadas",
          description: "Ahora recibirás alertas importantes de tu copiloto IA.",
        });
        return true;
      } else {
        toast({
          title: "❌ Permisos denegados",
          description: "No podrás recibir notificaciones push. Puedes activarlas desde la configuración del navegador.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('❌ Error requesting permission:', error);
      return false;
    }
  };

  const subscribe = async (): Promise<boolean> => {
    if (!user || permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // For now, we'll use a placeholder VAPID key since the function doesn't exist yet
      // In production, you'd call an edge function to get the VAPID key
      const vapidKey = 'placeholder-vapid-key';
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey
      });

      const subscriptionData = subscription.toJSON();

      // Save subscription to Supabase
      const { error } = await supabase.from('push_subscriptions').insert({
        user_id: user!.id,
        endpoint: subscriptionData.endpoint!,
        p256dh: subscriptionData.keys!.p256dh!,
        auth: subscriptionData.keys!.auth!,
      });

      if (error) throw error;

      await loadSubscriptions();
      
      toast({
        title: "🔔 Suscripción exitosa",
        description: "Estás suscrito a las notificaciones de RestroWizard.",
      });

      return true;
    } catch (error) {
      console.error('❌ Error subscribing to push notifications:', error);
      toast({
        title: "❌ Error en suscripción",
        description: "No se pudo completar la suscripción. Inténtalo de nuevo.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async (subscriptionId?: string): Promise<boolean> => {
    if (!user) return false;

    setIsLoading(true);

    try {
      if (subscriptionId) {
        // Unsubscribe specific subscription
        const { error } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('id', subscriptionId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Unsubscribe all user subscriptions
        const { error } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id);

        if (error) throw error;

        // Also unsubscribe from browser
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }

      await loadSubscriptions();

      toast({
        title: "🔕 Desuscripción exitosa",
        description: "Ya no recibirás notificaciones push.",
      });

      return true;
    } catch (error) {
      console.error('❌ Error unsubscribing:', error);
      toast({
        title: "❌ Error al desuscribirse",
        description: "No se pudo completar la desuscripción.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (newPreferences: TablesUpdate<'notification_preferences'>): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...newPreferences
        });

      if (error) throw error;

      await loadPreferences();

      toast({
        title: "✅ Preferencias actualizadas",
        description: "Tus preferencias de notificación han sido guardadas.",
      });

      return true;
    } catch (error) {
      console.error('❌ Error updating preferences:', error);
      toast({
        title: "❌ Error",
        description: "No se pudieron actualizar las preferencias.",
        variant: "destructive"
      });
      return false;
    }
  };

  const sendTestNotification = async () => {
    if (!user || !isSubscribed) return;

    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: user.id,
          title: '🧙‍♂️ Test de RestroWizard',
          body: '¡Tu copiloto IA está funcionando correctamente!',
          notificationType: 'test'
        }
      });

      if (error) throw error;

      toast({
        title: "📤 Notificación de prueba enviada",
        description: "Revisa si recibiste la notificación.",
      });
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      toast({
        title: "❌ Error enviando prueba",
        description: "No se pudo enviar la notificación de prueba.",
        variant: "destructive"
      });
    }
  };

  return {
    permission,
    isSubscribed,
    isLoading,
    subscriptions,
    preferences,
    isSupported: checkNotificationSupport(),
    requestPermission,
    subscribe,
    unsubscribe,
    updatePreferences,
    sendTestNotification,
    refresh: () => {
      loadSubscriptions();
      loadPreferences();
    }
  };
};
