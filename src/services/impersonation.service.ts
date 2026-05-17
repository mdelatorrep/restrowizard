import { supabase } from "@/integrations/supabase/client";
import { fail, ok, type ServiceResult } from "./_base";

/**
 * Start logging a consultant impersonation session.
 * Returns the log_id used later to close the session.
 */
export async function startImpersonation(
  clientUserId: string,
  clientBusinessId: string,
): Promise<ServiceResult<string>> {
  const { data, error } = await (supabase as any).rpc("log_consultant_impersonation_start", {
    p_client_user_id: clientUserId,
    p_client_business_id: clientBusinessId,
    p_user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
  });
  if (error) return fail<string>(error.message, error.code, error);
  return ok(data as string);
}

export async function endImpersonation(logId: string): Promise<ServiceResult<true>> {
  const { error } = await (supabase as any).rpc("log_consultant_impersonation_end", {
    p_log_id: logId,
  });
  if (error) return fail<true>(error.message, error.code, error);
  return ok(true as const);
}
