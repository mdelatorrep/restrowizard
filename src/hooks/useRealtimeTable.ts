import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type Event = "INSERT" | "UPDATE" | "DELETE" | "*";

interface Options<T extends Record<string, any> = Record<string, any>> {
  /** Postgres table name (without schema). */
  table: string;
  /** Schema, defaults to "public". */
  schema?: string;
  /** PostgREST filter, e.g. "user_id=eq.123". */
  filter?: string;
  /** Subscribed events; default "*". */
  event?: Event;
  /** Channel name; defaults to `rt:${schema}.${table}:${filter ?? "all"}`. */
  channelName?: string;
  /** Disable the subscription without unmounting. */
  enabled?: boolean;
  /** Callback for each payload. */
  onChange: (payload: RealtimePostgresChangesPayload<T>) => void;
}

/**
 * Single-channel-per-config Realtime hook.
 *
 * - Avoids the common pattern of creating a new channel on every effect cycle.
 * - Always unsubscribes on unmount / dependency change.
 * - Keeps the latest `onChange` in a ref so re-renders don't re-subscribe.
 *
 * Usage:
 *   useRealtimeTable({
 *     table: "restaurant_orders",
 *     filter: `user_id=eq.${userId}`,
 *     onChange: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
 *   });
 */
export function useRealtimeTable<T extends Record<string, any> = Record<string, any>>(
  opts: Options<T>,
) {
  const cbRef = useRef(opts.onChange);
  cbRef.current = opts.onChange;

  const { table, schema = "public", filter, event = "*", enabled = true, channelName } = opts;

  useEffect(() => {
    if (!enabled) return;
    const name = channelName ?? `rt:${schema}.${table}:${filter ?? "all"}`;
    const channel: RealtimeChannel = supabase
      .channel(name)
      .on(
        "postgres_changes" as never,
        { event, schema, table, ...(filter ? { filter } : {}) },
        (payload: RealtimePostgresChangesPayload<T>) => cbRef.current(payload),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, schema, filter, event, enabled, channelName]);
}
