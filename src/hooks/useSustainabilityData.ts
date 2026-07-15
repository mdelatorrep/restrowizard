import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';
import { useToast } from './use-toast';
import { qk } from '@/lib/queryKeys';

export type WasteCategory = 'overproduction' | 'plate_waste' | 'preparation' | 'spoilage' | 'storage' | 'other';

export interface FoodWasteLog {
  id: string;
  item_name: string;
  category: WasteCategory;
  quantity_kg: number;
  estimated_cost: number | null;
  reason: string | null;
  preventable: boolean | null;
  waste_date: string;
}

export interface CarbonItem {
  id: string;
  item_name: string;
  category: string;
  co2_per_kg: number;
  distance_km: number | null;
  is_local: boolean | null;
  supplier_name: string | null;
  water_usage_liters: number | null;
}

export interface SustainabilityKPIs {
  totalWasteKg: number;
  totalWasteCost: number;
  preventableWastePercentage: number;
  wasteByCategory: Record<string, number>;
  totalCarbonFootprint: number;
  localSourcingPercentage: number;
  carbonByCategory: Record<string, number>;
  waterUsage: number;
}

export interface SustainabilityBenchmarks {
  wastePercentage: number;
  carbonPerCover: number;
}

interface SustainabilityData {
  wasteLogs: FoodWasteLog[];
  carbonItems: CarbonItem[];
}

const computeKPIs = (wasteData: FoodWasteLog[], carbonData: CarbonItem[]): SustainabilityKPIs => {
  const totalWasteKg = wasteData.reduce((sum, w) => sum + Number(w.quantity_kg), 0);
  const totalWasteCost = wasteData.reduce((sum, w) => sum + Number(w.estimated_cost || 0), 0);
  const preventableCount = wasteData.filter(w => w.preventable).length;
  const preventableWastePercentage = wasteData.length ? (preventableCount / wasteData.length) * 100 : 0;

  const wasteByCategory: Record<string, number> = {};
  wasteData.forEach(w => {
    wasteByCategory[w.category] = (wasteByCategory[w.category] || 0) + Number(w.quantity_kg);
  });

  const totalCarbonFootprint = carbonData.reduce((sum, c) => sum + Number(c.co2_per_kg), 0);
  const localItems = carbonData.filter(c => c.is_local).length;
  const localSourcingPercentage = carbonData.length ? (localItems / carbonData.length) * 100 : 0;

  const carbonByCategory: Record<string, number> = {};
  carbonData.forEach(c => {
    carbonByCategory[c.category] = (carbonByCategory[c.category] || 0) + Number(c.co2_per_kg);
  });

  const waterUsage = carbonData.reduce((sum, c) => sum + Number(c.water_usage_liters || 0), 0);

  return {
    totalWasteKg,
    totalWasteCost,
    preventableWastePercentage,
    wasteByCategory,
    totalCarbonFootprint,
    localSourcingPercentage,
    carbonByCategory,
    waterUsage,
  };
};

export const useSustainabilityData = (dateRange?: { start: Date; end: Date }) => {
  const { userId, isViewingClient } = useDataUserId();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const rangeKey = dateRange
    ? `${dateRange.start.toISOString().split('T')[0]}_${dateRange.end.toISOString().split('T')[0]}`
    : 'all';

  const { data, isLoading: loading } = useQuery({
    queryKey: qk.sustainability.data(userId, rangeKey),
    enabled: !!userId,
    queryFn: async (): Promise<SustainabilityData> => {
      // Fetch waste logs
      let wasteQuery = supabase
        .from('food_waste_logs')
        .select('*')
        .eq('user_id', userId!)
        .order('waste_date', { ascending: false });

      if (dateRange) {
        wasteQuery = wasteQuery
          .gte('waste_date', dateRange.start.toISOString().split('T')[0])
          .lte('waste_date', dateRange.end.toISOString().split('T')[0]);
      }

      const { data: wasteData, error: wasteError } = await wasteQuery;
      if (wasteError) throw wasteError;

      // Fetch carbon items
      const { data: carbonData, error: carbonError } = await supabase
        .from('carbon_footprint_items')
        .select('*')
        .eq('user_id', userId!)
        .order('item_name');

      if (carbonError) throw carbonError;

      return {
        wasteLogs: (wasteData || []) as FoodWasteLog[],
        carbonItems: (carbonData || []) as CarbonItem[],
      };
    },
  });

  const { data: benchmarks = null } = useQuery({
    queryKey: qk.sustainability.benchmarks(),
    queryFn: async (): Promise<SustainabilityBenchmarks | null> => {
      const { data, error } = await supabase
        .from('industry_benchmarks')
        .select('*')
        .eq('metric_category', 'sustainability');
      if (error) throw error;
      if (!data || data.length === 0) return null;
      const benchmarkMap: Record<string, number> = {};
      data.forEach(b => { benchmarkMap[b.metric_name] = Number(b.avg_value); });
      return {
        wastePercentage: benchmarkMap['waste_percentage'] || 8.5,
        carbonPerCover: benchmarkMap['carbon_footprint_per_cover'] || 2.8,
      };
    },
  });

  const wasteLogs = data?.wasteLogs ?? [];
  const carbonItems = data?.carbonItems ?? [];
  const kpis = useMemo(() => (data ? computeKPIs(wasteLogs, carbonItems) : null), [data, wasteLogs, carbonItems]);
  const hasData = wasteLogs.length > 0 || carbonItems.length > 0;

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: qk.sustainability.data(userId, rangeKey) }),
    [queryClient, userId, rangeKey]
  );

  const addWasteLog = async (
    log: Omit<FoodWasteLog, 'id'> & { inventory_item_id?: string | null }
  ) => {
    if (!userId) return null;

    const { inventory_item_id, ...rest } = log;

    try {
      const { data: inserted, error } = await supabase
        .from('food_waste_logs')
        .insert({
          ...rest,
          user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;

      // TK-I: si está vinculado a inventario, descontar stock y registrar movimiento
      if (inventory_item_id && rest.quantity_kg > 0) {
        const { data: item } = await supabase
          .from('inventory_items')
          .select('current_stock, unit_cost')
          .eq('id', inventory_item_id)
          .maybeSingle();

        if (item) {
          const before = Number(item.current_stock) || 0;
          const change = rest.quantity_kg;
          const after = Math.max(0, before - change);
          const unitCost = Number(item.unit_cost) || 0;

          await supabase
            .from('inventory_items')
            .update({ current_stock: after })
            .eq('id', inventory_item_id);

          await supabase.from('inventory_movements').insert({
            user_id: userId,
            inventory_item_id,
            movement_type: 'waste',
            quantity_before: before,
            quantity_change: -change,
            quantity_after: after,
            unit_cost: unitCost,
            total_cost: unitCost * change,
            reference_type: 'food_waste_log',
            reference_id: inserted.id,
            notes: rest.reason || `Desperdicio: ${rest.category}`,
          });

          // El stock cambió: refrescar también las vistas de inventario.
          await queryClient.invalidateQueries({ queryKey: qk.inventory.items(userId) });
          await queryClient.invalidateQueries({ queryKey: qk.inventory.movements(userId) });
        }
      }

      toast({
        title: "Desperdicio registrado",
        description: inventory_item_id
          ? "Stock actualizado desde inventario."
          : "El registro se ha guardado correctamente",
      });

      await invalidate();
      return inserted;
    } catch (error: any) {
      console.error('Error adding waste log:', error);
      toast({
        title: "Error al guardar",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const addCarbonItem = async (item: Omit<CarbonItem, 'id'>) => {
    if (!userId) return null;

    try {
      const { data: inserted, error } = await supabase
        .from('carbon_footprint_items')
        .insert({
          ...item,
          user_id: userId
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Ítem de huella de carbono agregado" });

      await invalidate();
      return inserted;
    } catch (error: any) {
      console.error('Error adding carbon item:', error);
      toast({
        title: "Error al guardar",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const deleteWasteLog = async (id: string) => {
    try {
      const { error } = await supabase
        .from('food_waste_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Registro eliminado" });
      await invalidate();
    } catch (error: any) {
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return {
    wasteLogs,
    carbonItems,
    kpis,
    benchmarks,
    loading,
    hasData,
    isViewingClient,
    addWasteLog,
    addCarbonItem,
    deleteWasteLog,
    refetch: invalidate
  };
};
