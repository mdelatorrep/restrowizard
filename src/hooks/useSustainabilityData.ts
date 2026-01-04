import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';
import { useToast } from './use-toast';

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

export const useSustainabilityData = (dateRange?: { start: Date; end: Date }) => {
  const { userId, isViewingClient } = useDataUserId();
  const { toast } = useToast();
  const [wasteLogs, setWasteLogs] = useState<FoodWasteLog[]>([]);
  const [carbonItems, setCarbonItems] = useState<CarbonItem[]>([]);
  const [kpis, setKpis] = useState<SustainabilityKPIs | null>(null);
  const [benchmarks, setBenchmarks] = useState<SustainabilityBenchmarks | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  const fetchData = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch waste logs
      let wasteQuery = supabase
        .from('food_waste_logs')
        .select('*')
        .eq('user_id', userId)
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
        .eq('user_id', userId)
        .order('item_name');

      if (carbonError) throw carbonError;

      setWasteLogs(wasteData || []);
      setCarbonItems(carbonData || []);
      setHasData((wasteData?.length || 0) > 0 || (carbonData?.length || 0) > 0);

      // Calculate KPIs
      const totalWasteKg = (wasteData || []).reduce((sum, w) => sum + Number(w.quantity_kg), 0);
      const totalWasteCost = (wasteData || []).reduce((sum, w) => sum + Number(w.estimated_cost || 0), 0);
      const preventableCount = (wasteData || []).filter(w => w.preventable).length;
      const preventableWastePercentage = wasteData?.length 
        ? (preventableCount / wasteData.length) * 100 
        : 0;

      const wasteByCategory: Record<string, number> = {};
      (wasteData || []).forEach(w => {
        wasteByCategory[w.category] = (wasteByCategory[w.category] || 0) + Number(w.quantity_kg);
      });

      const totalCarbonFootprint = (carbonData || []).reduce((sum, c) => sum + Number(c.co2_per_kg), 0);
      const localItems = (carbonData || []).filter(c => c.is_local).length;
      const localSourcingPercentage = carbonData?.length 
        ? (localItems / carbonData.length) * 100 
        : 0;

      const carbonByCategory: Record<string, number> = {};
      (carbonData || []).forEach(c => {
        carbonByCategory[c.category] = (carbonByCategory[c.category] || 0) + Number(c.co2_per_kg);
      });

      const waterUsage = (carbonData || []).reduce((sum, c) => sum + Number(c.water_usage_liters || 0), 0);

      setKpis({
        totalWasteKg,
        totalWasteCost,
        preventableWastePercentage,
        wasteByCategory,
        totalCarbonFootprint,
        localSourcingPercentage,
        carbonByCategory,
        waterUsage
      });
    } catch (error: any) {
      console.error('Error fetching sustainability data:', error);
      toast({
        title: "Error al cargar datos de sostenibilidad",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBenchmarks = async () => {
    try {
      const { data, error } = await supabase
        .from('industry_benchmarks')
        .select('*')
        .eq('metric_category', 'sustainability');

      if (error) throw error;

      if (data && data.length > 0) {
        const benchmarkMap: Record<string, number> = {};
        data.forEach(b => {
          benchmarkMap[b.metric_name] = Number(b.avg_value);
        });

        setBenchmarks({
          wastePercentage: benchmarkMap['waste_percentage'] || 8.5,
          carbonPerCover: benchmarkMap['carbon_footprint_per_cover'] || 2.8
        });
      }
    } catch (error: any) {
      console.error('Error fetching benchmarks:', error);
    }
  };

  const addWasteLog = async (log: Omit<FoodWasteLog, 'id'>) => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('food_waste_logs')
        .insert({
          ...log,
          user_id: userId
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Desperdicio registrado",
        description: "El registro se ha guardado correctamente"
      });

      await fetchData();
      return data;
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
      const { data, error } = await supabase
        .from('carbon_footprint_items')
        .insert({
          ...item,
          user_id: userId
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Ítem de huella de carbono agregado"
      });

      await fetchData();
      return data;
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
      await fetchData();
    } catch (error: any) {
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchData();
    fetchBenchmarks();
  }, [userId, dateRange?.start, dateRange?.end]);

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
    refetch: fetchData
  };
};
