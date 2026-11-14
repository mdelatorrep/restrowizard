// B-25: tope diario de llamadas de IA por usuario y función.
// Usa public.ai_usage_bump (solo service_role). Si el conteo falla, deja pasar:
// un error de contabilidad no debe tumbar el copiloto.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export const AI_DAILY_LIMITS: Record<string, number> = {
  "copilot-chat": 60,
  default: 40,
};

export async function checkAiQuota(
  admin: SupabaseClient,
  userId: string,
  fn: string,
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const limit = AI_DAILY_LIMITS[fn] ?? AI_DAILY_LIMITS.default;
  const { data, error } = await admin.rpc("ai_usage_bump", { p_user: userId, p_fn: fn });
  if (error) {
    console.error("[ai-quota] no se pudo registrar el uso", error.message);
    return { allowed: true, used: 0, limit };
  }
  const used = Number(data ?? 0);
  return { allowed: used <= limit, used, limit };
}
