import { supabase } from '@/integrations/supabase/client';

/**
 * Best-effort debug event logger.
 * - Never throws
 * - Never blocks user flow
 * - Stores events in `public.debug_events` (RLS: user can read/write own rows)
 */
export const pushDebugEvent = async (
  userId: string | undefined | null,
  scope: string,
  action: string,
  data?: Record<string, unknown>
) => {
  if (!userId) return;

  try {
    await supabase.from('debug_events').insert({
      user_id: userId,
      scope,
      action,
      data: data ?? {},
    });
  } catch (e) {
    // Swallow errors: traceability must never break the product.
    console.warn('🧾 [debug_events] insert failed:', e);
  }
};
