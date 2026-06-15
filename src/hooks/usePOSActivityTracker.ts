import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Opts {
  enabled: boolean;
  userId: string | null;
  sessionId?: string | null;
  staffId?: string | null;
  staffName?: string | null;
  terminalId?: string | null;
  intervalMs?: number;
}

/**
 * Heartbeat that records cashier activity every `intervalMs` (default 30s)
 * while the POS tab is visible. Used to detect inactivity and fraud signals.
 */
export function usePOSActivityTracker({
  enabled,
  userId,
  sessionId,
  staffId,
  staffName,
  terminalId,
  intervalMs = 30000,
}: Opts) {
  const lastPingRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || !userId) return;

    const ping = async (activityType: string = "ping", metadata: Record<string, unknown> = {}) => {
      const now = Date.now();
      if (now - lastPingRef.current < 5000 && activityType === "ping") return;
      lastPingRef.current = now;
      try {
        await (supabase as any).from("pos_user_activity").insert({
          user_id: userId,
          session_id: sessionId ?? null,
          staff_id: staffId ?? null,
          staff_name: staffName ?? null,
          terminal_id: terminalId ?? null,
          activity_type: activityType,
          metadata,
        });
      } catch (e) {
        console.warn("[pos-activity] ping failed", e);
      }
    };

    ping("session_start");
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") ping("ping");
    }, intervalMs);

    const onVisibility = () => {
      if (document.visibilityState === "visible") ping("focus");
      else ping("blur");
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onInteract = () => ping("ping");
    window.addEventListener("pointerdown", onInteract);
    window.addEventListener("keydown", onInteract);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
    };
  }, [enabled, userId, sessionId, staffId, staffName, terminalId, intervalMs]);
}
