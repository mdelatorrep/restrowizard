import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';
import { useToast } from './use-toast';

export interface StaffMember {
  id: string;
  name: string;
  position: string;
  hourly_rate: number | null;
  hire_date: string | null;
  performance_score: number | null;
  training_progress: number | null;
  is_active: boolean;
}

export interface TalentKPIs {
  totalStaff: number;
  activeStaff: number;
  avgPerformance: number;
  avgTrainingProgress: number;
  avgHourlyRate: number;
  topPerformers: StaffMember[];
  needsAttention: StaffMember[];
  positionBreakdown: Record<string, number>;
}

export interface TalentBenchmarks {
  turnoverRate: number;
  trainingCompletion: number;
}

export const useTalentData = () => {
  const { userId, isViewingClient } = useDataUserId();
  const { toast } = useToast();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [kpis, setKpis] = useState<TalentKPIs | null>(null);
  const [benchmarks, setBenchmarks] = useState<TalentBenchmarks | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  const fetchStaff = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('staff_members')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (error) throw error;

      setStaff(data || []);
      setHasData((data?.length || 0) > 0);

      // Calculate KPIs
      if (data && data.length > 0) {
        const activeStaff = data.filter(s => s.is_active);
        const avgPerformance = activeStaff.reduce((sum, s) => sum + Number(s.performance_score || 0), 0) / activeStaff.length;
        const avgTrainingProgress = activeStaff.reduce((sum, s) => sum + (s.training_progress || 0), 0) / activeStaff.length;
        const avgHourlyRate = activeStaff.reduce((sum, s) => sum + Number(s.hourly_rate || 0), 0) / activeStaff.length;

        const topPerformers = [...activeStaff]
          .sort((a, b) => Number(b.performance_score || 0) - Number(a.performance_score || 0))
          .slice(0, 3);

        const needsAttention = activeStaff
          .filter(s => Number(s.performance_score || 0) < 60 || (s.training_progress || 0) < 50)
          .slice(0, 3);

        const positionBreakdown: Record<string, number> = {};
        activeStaff.forEach(s => {
          positionBreakdown[s.position] = (positionBreakdown[s.position] || 0) + 1;
        });

        setKpis({
          totalStaff: data.length,
          activeStaff: activeStaff.length,
          avgPerformance,
          avgTrainingProgress,
          avgHourlyRate,
          topPerformers,
          needsAttention,
          positionBreakdown
        });
      } else {
        setKpis(null);
      }
    } catch (error: any) {
      console.error('Error fetching talent data:', error);
      toast({
        title: "Error al cargar datos de talento",
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
        .eq('metric_category', 'talent');

      if (error) throw error;

      if (data && data.length > 0) {
        const benchmarkMap: Record<string, number> = {};
        data.forEach(b => {
          benchmarkMap[b.metric_name] = Number(b.avg_value);
        });

        setBenchmarks({
          turnoverRate: benchmarkMap['staff_turnover_rate'] || 45,
          trainingCompletion: benchmarkMap['training_completion_rate'] || 68
        });
      }
    } catch (error: any) {
      console.error('Error fetching benchmarks:', error);
    }
  };

  const addStaffMember = async (member: Omit<StaffMember, 'id'>) => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('staff_members')
        .insert({
          ...member,
          user_id: userId
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Empleado agregado",
        description: "El empleado se ha registrado correctamente"
      });

      await fetchStaff();
      return data;
    } catch (error: any) {
      console.error('Error adding staff:', error);
      toast({
        title: "Error al guardar",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const updateStaffMember = async (id: string, updates: Partial<StaffMember>) => {
    try {
      const { error } = await supabase
        .from('staff_members')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Empleado actualizado"
      });

      await fetchStaff();
    } catch (error: any) {
      console.error('Error updating staff:', error);
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteStaffMember = async (id: string) => {
    try {
      const { error } = await supabase
        .from('staff_members')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Empleado eliminado"
      });

      await fetchStaff();
    } catch (error: any) {
      console.error('Error deleting staff:', error);
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchBenchmarks();
  }, [userId]);

  return {
    staff,
    kpis,
    benchmarks,
    loading,
    hasData,
    isViewingClient,
    addStaffMember,
    updateStaffMember,
    deleteStaffMember,
    refetch: fetchStaff
  };
};
