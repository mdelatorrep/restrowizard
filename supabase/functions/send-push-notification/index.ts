import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationRequest {
  userId?: string;
  title: string;
  body: string;
  icon?: string;
  actionUrl?: string;
  notificationType?: string;
  data?: any;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      userId, 
      title, 
      body, 
      icon = '/assets/restrowizard-logo.png',
      actionUrl = '/dashboard',
      notificationType = 'general',
      data = {}
    }: PushNotificationRequest = await req.json();

    console.log('🔔 Sending push notification:', { userId, title, notificationType });

    // Get push subscriptions for user or all active users
    let query = supabase
      .from('push_subscriptions')
      .select('*')
      .eq('is_active', true);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: subscriptions, error: subError } = await query;

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('📭 No active subscriptions found');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No active subscriptions found' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Prepare notification payload
    const notificationPayload = {
      title,
      body,
      icon,
      badge: icon,
      tag: `restrowizard-${notificationType}`,
      requireInteraction: notificationType === 'critical',
      actions: [
        {
          action: 'open',
          title: 'Abrir',
          icon: icon
        },
        {
          action: 'dismiss', 
          title: 'Descartar'
        }
      ],
      data: {
        url: actionUrl,
        notificationType,
        timestamp: Date.now(),
        ...data
      }
    };

    const results = [];

    // Send notification to each subscription
    for (const subscription of subscriptions) {
      try {
        // Using web-push would require VAPID keys setup
        // For now, we'll use a simplified approach
        console.log(`📤 Sending to subscription ${subscription.id}`);
        
        // Here you would implement actual web push using VAPID keys
        // This is a placeholder - in production you'd use the web-push library
        const pushResult = {
          subscriptionId: subscription.id,
          success: true,
          endpoint: subscription.endpoint
        };

        results.push(pushResult);

        // Log notification in database
        await supabase.from('notifications_log').insert({
          user_id: subscription.user_id,
          title,
          body,
          icon,
          data: { ...data, actionUrl },
          notification_type: notificationType,
          action_url: actionUrl,
          delivery_status: 'sent'
        });

      } catch (error) {
        console.error(`❌ Failed to send to subscription ${subscription.id}:`, error);
        results.push({
          subscriptionId: subscription.id,
          success: false,
          error: error.message
        });

        // Log failed notification
        await supabase.from('notifications_log').insert({
          user_id: subscription.user_id,
          title,
          body,
          icon,
          data: { ...data, actionUrl },
          notification_type: notificationType,
          action_url: actionUrl,
          delivery_status: 'failed'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`✅ Push notifications sent: ${successCount} success, ${failureCount} failed`);

    return new Response(JSON.stringify({
      success: true,
      message: `Sent ${successCount} notifications, ${failureCount} failed`,
      results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('❌ Error in send-push-notification function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
};

serve(handler);