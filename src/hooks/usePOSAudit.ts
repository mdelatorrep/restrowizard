import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PosAuditEntry {
  userId: string;
  entity: string;
  action: string;
  entityId?: string | null;
  reason?: string | null;
  amount?: number | null;
  before?: unknown;
  after?: unknown;
  sessionId?: string | null;
  terminalId?: string | null;
  actorStaffId?: string | null;
  actorName?: string | null;
  actorRole?: string | null;
  supervisorStaffId?: string | null;
  supervisorName?: string | null;
  authorizationId?: string | null;
  metadata?: Record<string, unknown> | null;
}

function getTerminalId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem("pos.terminal_id");
  if (!id) {
    id = `term-${crypto.randomUUID().slice(0, 8)}`;
    localStorage.setItem("pos.terminal_id", id);
  }
  return id;
}

export function usePOSAudit() {
  const log = useCallback(async (e: PosAuditEntry) => {
    try {
      await (supabase as any).rpc("pos_log_audit", {
        p_user_id: e.userId,
        p_entity: e.entity,
        p_action: e.action,
        p_entity_id: e.entityId ?? null,
        p_actor_staff_id: e.actorStaffId ?? null,
        p_actor_name: e.actorName ?? null,
        p_actor_role: e.actorRole ?? null,
        p_supervisor_staff_id: e.supervisorStaffId ?? null,
        p_supervisor_name: e.supervisorName ?? null,
        p_authorization_id: e.authorizationId ?? null,
        p_session_id: e.sessionId ?? null,
        p_terminal_id: e.terminalId ?? getTerminalId(),
        p_reason: e.reason ?? null,
        p_amount: e.amount ?? null,
        p_before: e.before ?? null,
        p_after: e.after ?? null,
        p_metadata: e.metadata ?? {},
      });
    } catch (err) {
      // Audit must never block business flows
      console.warn("[pos-audit] log failed", err);
    }
  }, []);

  return { log, terminalId: getTerminalId() };
}
