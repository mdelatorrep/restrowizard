import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";

export type RappiIntegration = {
  id: string;
  user_id: string;
  brand_id: string | null;
  platform: string;
  client_id: string | null;
  store_ids: string[] | null;
  environment: string | null;
  is_active: boolean;
  webhook_secret: string | null;
  last_sync_at: string | null;
  sync_status: any;
  token_expires_at: string | null;
};

export const useRappiIntegration = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const integrationQuery = useQuery({
    queryKey: ["rappi-integration", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("aggregator_integrations")
        .select("id, user_id, brand_id, platform, client_id, store_ids, environment, is_active, webhook_secret, last_sync_at, sync_status, token_expires_at")
        .eq("user_id", user.id)
        .eq("platform", "rappi")
        .maybeSingle();
      if (error) throw error;
      return (data as RappiIntegration | null);
    },
    enabled: !!user,
  });

  const save = useMutation({
    mutationFn: async (payload: {
      client_id: string;
      client_secret: string;
      store_ids: string[];
      environment: "sandbox" | "production";
      webhook_secret?: string;
      integration_id?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("rappi-auth", {
        body: { action: "save", ...payload },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => {
      toast({ title: "Credenciales guardadas" });
      qc.invalidateQueries({ queryKey: ["rappi-integration"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const test = useMutation({
    mutationFn: async (integration_id: string) => {
      const { data, error } = await supabase.functions.invoke("rappi-auth", {
        body: { action: "test", integration_id },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => toast({ title: "Conexión exitosa con Rappi" }),
    onError: (e: any) => toast({ title: "Error de conexión", description: e.message, variant: "destructive" }),
  });

  const syncMenu = useMutation({
    mutationFn: async (params: { integration_id: string; store_id: string; menu_id?: string }) => {
      const { data, error } = await supabase.functions.invoke("rappi-sync-menu", { body: params });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: (d: any) => toast({ title: `Menú sincronizado (${d?.items_synced ?? 0} items)` }),
    onError: (e: any) => toast({ title: "Error sincronizando menú", description: e.message, variant: "destructive" }),
  });

  const storeControl = useMutation({
    mutationFn: async (params: { integration_id: string; store_id: string; status: string; reason?: string; pause_until?: string; schedule?: any }) => {
      const { data, error } = await supabase.functions.invoke("rappi-store-control", { body: params });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => toast({ title: "Tienda actualizada" }),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const orderAction = useMutation({
    mutationFn: async (params: { order_id: string; action: "accept" | "reject" | "ready" | "delivered"; reason?: string }) => {
      const { data, error } = await supabase.functions.invoke("rappi-order-action", { body: params });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => {
      toast({ title: "Pedido actualizado" });
      qc.invalidateQueries({ queryKey: ["rappi-orders"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return { integration: integrationQuery.data, isLoading: integrationQuery.isLoading, save, test, syncMenu, storeControl, orderAction };
};

export const useRappiOrders = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["rappi-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("aggregator_orders")
        .select("*")
        .eq("user_id", user.id)
        .eq("platform", "rappi")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("rappi-orders-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "aggregator_orders", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["rappi-orders", user.id] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  return query;
};

export const useRappiSettlements = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["rappi-settlements", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("rappi_settlements")
        .select("*")
        .eq("user_id", user.id)
        .order("settlement_date", { ascending: false })
        .limit(90);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
};

export const useRappiMenuSyncByStore = (integrationId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["rappi-menu-sync", user?.id, integrationId],
    queryFn: async () => {
      if (!user || !integrationId) return {} as Record<string, { total: number; synced: number; errors: number; last: string | null }>;
      const { data, error } = await supabase
        .from("rappi_menu_sync")
        .select("store_id, status, last_synced_at")
        .eq("integration_id", integrationId);
      if (error) throw error;
      const map: Record<string, { total: number; synced: number; errors: number; last: string | null }> = {};
      for (const row of (data ?? []) as any[]) {
        const k = row.store_id as string;
        if (!map[k]) map[k] = { total: 0, synced: 0, errors: 0, last: null };
        map[k].total += 1;
        if (row.status === "synced") map[k].synced += 1;
        if (row.status === "error") map[k].errors += 1;
        if (row.last_synced_at && (!map[k].last || row.last_synced_at > map[k].last!)) map[k].last = row.last_synced_at;
      }
      return map;
    },
    enabled: !!user && !!integrationId,
  });
};
