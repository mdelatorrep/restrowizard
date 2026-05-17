import { supabase } from "@/integrations/supabase/client";
import { fail, ok, type ServiceResult } from "./_base";

export type AuditAction = "create" | "update" | "delete" | "login" | "logout" | "export" | "impersonate" | string;

export interface AuditEntry {
  business_id?: string | null;
  actor_id?: string | null;
  entity: string;
  entity_id?: string | null;
  action: AuditAction;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown> | null;
}

/**
 * Append a single audit_log entry. Best-effort: failures are swallowed and reported
 * via the returned ServiceResult so business flows are never blocked by auditing.
 */
export async function logAudit(entry: AuditEntry): Promise<ServiceResult<true>> {
  const { data: userRes } = await supabase.auth.getUser();
  const user_id = userRes?.user?.id ?? null;

  const { error } = await (supabase as any).from("audit_log").insert({
    user_id,
    actor_id: entry.actor_id ?? user_id,
    business_id: entry.business_id ?? null,
    entity: entry.entity,
    entity_id: entry.entity_id ?? null,
    action: entry.action,
    before: entry.before ?? null,
    after: entry.after ?? null,
    metadata: entry.metadata ?? null,
  });

  if (error) return fail<true>(error.message, error.code, error);
  return ok(true as const);
}
