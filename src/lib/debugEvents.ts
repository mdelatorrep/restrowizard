import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

/**
 * Best-effort debug event logger.
 * - Never throws, never blocks user flow, never logs to console.
 * - Always inserts with the *current* authenticated user (auth.uid()) to
 *   avoid 403 when an impersonated client user_id is passed by mistake.
 */
export const pushDebugEvent = async (
  _userIdHint: string | undefined | null,
  scope: string,
  action: string,
  data?: Record<string, unknown>
) => {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id;
    if (!uid) return;
    await supabase.from('debug_events').insert([
      { user_id: uid, scope, action, data: (data ?? {}) as Json },
    ]);
  } catch {
    // Telemetry must never break the product or pollute console.
  }
};
