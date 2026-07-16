import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDataUserId } from './useDataUserId';
import type { Json, TablesUpdate } from '@/integrations/supabase/types';

export interface SalesGoal {
  id: string;
  user_id: string;
  period_type: string;
  period_start: string;
  period_end: string;
  revenue_goal: number | null;
  covers_goal: number | null;
  avg_ticket_goal: number | null;
  category_goals: Record<string, number>;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SalesProjection {
  id: string;
  user_id: string;
  projection_date: string;
  projected_revenue: number | null;
  projected_covers: number | null;
  confidence_level: number | null;
  factors: Record<string, unknown>;
  ai_reasoning: string | null;
  created_at: string;
}

export interface SalesKPIs {
  currentGoal: number;
  currentProgress: number;
  progressPercent: number;
  daysRemaining: number;
  dailyTarget: number;
  projectedCompletion: number;
}

export const useSalesGoals = () => {
  const [goals, setGoals] = useState<SalesGoal[]>([]);
  const [projections, setProjections] = useState<SalesProjection[]>([]);
  const [currentGoal, setCurrentGoal] = useState<SalesGoal | null>(null);
  const [kpis, setKpis] = useState<SalesKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const { toast } = useToast();
  const { userId } = useDataUserId();

  const calculateKPIs = (goal: SalesGoal | null, actualRevenue: number): SalesKPIs => {
    if (!goal || !goal.revenue_goal) {
      return { currentGoal: 0, currentProgress: 0, progressPercent: 0, daysRemaining: 0, dailyTarget: 0, projectedCompletion: 0 };
    }

    const today = new Date();
    const endDate = new Date(goal.period_end);
    const startDate = new Date(goal.period_start);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    
    const progressPercent = Math.round((actualRevenue / goal.revenue_goal) * 100);
    const remaining = goal.revenue_goal - actualRevenue;
    const dailyTarget = daysRemaining > 0 ? remaining / daysRemaining : 0;
    
    const dailyAvg = elapsedDays > 0 ? actualRevenue / elapsedDays : 0;
    const projectedCompletion = dailyAvg * totalDays;

    return {
      currentGoal: goal.revenue_goal,
      currentProgress: actualRevenue,
      progressPercent,
      daysRemaining,
      dailyTarget: Math.round(dailyTarget),
      projectedCompletion: Math.round(projectedCompletion),
    };
  };

  const fetchGoals = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sales_goals')
        .select('*')
        .eq('user_id', userId)
        .order('period_start', { ascending: false });

      if (error) throw error;
      
      const goalsData = (data || []) as unknown as SalesGoal[];
      setGoals(goalsData);
      
      const today = new Date().toISOString().split('T')[0];
      const active = goalsData.find(g => g.period_start <= today && g.period_end >= today);
      setCurrentGoal(active || null);
      
      const actualRevenue = 0;
      setKpis(calculateKPIs(active || null, actualRevenue));
      setHasData(goalsData.length > 0);

      const { data: projectionsData } = await supabase
        .from('sales_projections')
        .select('*')
        .eq('user_id', userId)
        .order('projection_date', { ascending: false })
        .limit(30);
      
      setProjections((projectionsData || []) as unknown as SalesProjection[]);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async (goalData: { period_start: string; period_end: string; [key: string]: unknown }) => {
    if (!userId) return null;
    
    try {
      const { data, error } = await supabase
        .from('sales_goals')
        .insert([{ 
          period_start: goalData.period_start,
          period_end: goalData.period_end,
          user_id: userId,
          period_type: goalData.period_type as string | undefined,
          revenue_goal: goalData.revenue_goal as number | undefined,
          covers_goal: goalData.covers_goal as number | undefined,
          avg_ticket_goal: goalData.avg_ticket_goal as number | undefined,
          category_goals: (goalData.category_goals ?? null) as Json,
          notes: goalData.notes as string | undefined,
        }])
        .select()
        .single();

      if (error) throw error;
      
      toast({ title: 'Meta creada', description: 'Tu meta de ventas ha sido configurada' });
      await fetchGoals();
      return data;
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({ title: 'Error', description: 'No se pudo crear la meta', variant: 'destructive' });
      return null;
    }
  };

  const updateGoal = async (id: string, updates: TablesUpdate<'sales_goals'>) => {
    try {
      const { error } = await supabase
        .from('sales_goals')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: 'Meta actualizada', description: 'Los cambios han sido guardados' });
      await fetchGoals();
    } catch (error) {
      console.error('Error updating goal:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar la meta', variant: 'destructive' });
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sales_goals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: 'Meta eliminada', description: 'La meta ha sido eliminada' });
      await fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar la meta', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [userId]);

  return {
    goals,
    projections,
    currentGoal,
    kpis,
    loading,
    hasData,
    createGoal,
    updateGoal,
    deleteGoal,
    refetch: fetchGoals,
  };
};
