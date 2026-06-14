import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { maturityModel, getLevelFromScore } from '@/data/maturityModel';
import { useToast } from '@/hooks/use-toast';

export interface DiagnosisResult {
  pillarScores: Record<string, number>;
  overallScore: number;
  overallLevel: string;
}

export interface RestaurantContext {
  businessType?: string;
  location?: string;
  employeeCount?: number;
  averageTicket?: number;
  yearsOperating?: number;
  cuisineType?: string;
  seatingCapacity?: number;
}

export interface AIAnalysis {
  executive_summary: string;
  strengths: Array<{ pillar: string; description: string }>;
  critical_areas: Array<{ pillar: string; issue: string; impact: string }>;
  quick_opportunity: {
    title: string;
    description: string;
    expected_impact: string;
    timeframe: string;
  };
  main_risk: {
    title: string;
    description: string;
    consequences: string;
  };
}

export interface AIActionPlan {
  overview: string;
  estimated_roi: string;
  quick_wins: ActionPlanItem[];
  priority_actions: ActionPlanItem[];
  strategic_initiatives: ActionPlanItem[];
  kpis: Array<{
    name: string;
    current_baseline: string;
    target: string;
    measurement_frequency: string;
  }>;
}

export interface ActionPlanItem {
  id: string;
  title: string;
  description: string;
  pillar_id: string;
  resources: string;
  success_metric: string;
  timeframe: string;
  effort: 'bajo' | 'medio' | 'alto';
  impact: 'bajo' | 'medio' | 'alto';
}

export interface AIBenchmark {
  overall_percentile: number;
  industry_average: number;
  pillar_comparisons: Array<{
    pillar_id: string;
    pillar_name: string;
    user_score: number;
    industry_average: number;
    percentile: number;
    status: 'above' | 'at' | 'below';
    gap: number;
  }>;
  top_opportunities: Array<{
    title: string;
    description: string;
    industry_trend: string;
  }>;
  competitive_insight: string;
}

// Pure scoring logic — extracted so anonymous diagnosis (no hook context)
// can compute results without DB writes.
const computeScores = (answers: Record<number, number>): DiagnosisResult => {
  const pillarScores: Record<string, { total: number; count: number }> = {};
  maturityModel.pillars.forEach(p => { pillarScores[p.id] = { total: 0, count: 0 }; });
  maturityModel.questions.forEach((q, index) => {
    const answerValue = answers[index] || 0;
    pillarScores[q.pillarId].total += answerValue;
    pillarScores[q.pillarId].count++;
  });
  const pillarAverages: Record<string, number> = {};
  let totalScore = 0;
  let totalCount = 0;
  maturityModel.pillars.forEach(p => {
    const avg = pillarScores[p.id].count > 0 ? pillarScores[p.id].total / pillarScores[p.id].count : 0;
    pillarAverages[p.id] = avg;
    totalScore += pillarScores[p.id].total;
    totalCount += pillarScores[p.id].count;
  });
  const overallAverage = totalCount > 0 ? totalScore / totalCount : 0;
  const overallLevel = getLevelFromScore(overallAverage);
  return {
    pillarScores: pillarAverages,
    overallScore: overallAverage,
    overallLevel: overallLevel.name,
  };
};

export const calculateAnonymousDiagnosis = (
  answers: Record<number, number>
): DiagnosisResult & { diagnosisId?: string } => computeScores(answers);

export const useDiagnosis = () => {
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const { toast } = useToast();

  const calculateScores = computeScores;

  const saveDiagnosis = async (answers: Record<number, number>, userId: string, context?: RestaurantContext) => {
    console.log('🔍 Starting saveDiagnosis with:', { userId, answersCount: Object.keys(answers).length });
    setLoading(true);
    
    try {
      console.log('📊 Calculating scores...');
      const result = calculateScores(answers);
      console.log('✅ Scores calculated:', result);
      
      // Map the level name to database enum value
      const levelMapping: Record<string, string> = {
        'INICIAL': 'inicial',
        'BÁSICO': 'basico', 
        'INTERMEDIO': 'intermedio',
        'AVANZADO': 'avanzado',
        'EXPERTO': 'experto'
      };
      
      const dbLevel = levelMapping[result.overallLevel] || 'inicial';
      console.log('🏷️ Mapped level:', { original: result.overallLevel, mapped: dbLevel });
      
      console.log('💾 Inserting into database...');
      const insertData = {
        user_id: userId,
        answers,
        pillar_scores: result.pillarScores,
        overall_score: result.overallScore,
        overall_level: dbLevel as 'inicial' | 'basico' | 'intermedio' | 'avanzado' | 'experto',
        restaurant_context: context || null
      };
      
      const { data, error } = await supabase
        .from('maturity_diagnoses')
        .insert(insertData as any)
        .select()
        .single();

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }

      console.log('✅ Diagnosis saved successfully:', data);
      
      toast({
        title: "¡Diagnóstico guardado!",
        description: "Tu evaluación ha sido guardada correctamente.",
      });

      return { ...result, diagnosisId: data.id };
    } catch (error: any) {
      console.error('💥 Error in saveDiagnosis:', error);
      toast({
        title: "Error al guardar",
        description: error.message || 'Error desconocido',
        variant: "destructive",
      });
      throw error;
    } finally {
      console.log('🏁 Setting loading to false');
      setLoading(false);
    }
  };

  const generateAIAnalysis = async (diagnosisId: string, diagnosisData: DiagnosisResult, context?: RestaurantContext): Promise<AIAnalysis | null> => {
    console.log('🤖 Generating AI Analysis...');
    setAiLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('maturity-ai-engine', {
        body: {
          action: 'analyze_diagnosis',
          diagnosisData: {
            pillarScores: diagnosisData.pillarScores,
            overallScore: diagnosisData.overallScore,
            overallLevel: diagnosisData.overallLevel,
            answers: {}
          },
          restaurantContext: context
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      console.log('✅ AI Analysis received:', data.data);

      // Save to database (skip when anonymous)
      if (diagnosisId && diagnosisId !== 'anonymous') {
        await supabase
          .from('maturity_diagnoses')
          .update({ 
            ai_analysis: data.data,
            ai_generated_at: new Date().toISOString()
          })
          .eq('id', diagnosisId);
      }

      return data.data as AIAnalysis;
    } catch (error: any) {
      console.error('❌ Error generating AI analysis:', error);
      toast({
        title: "Error en análisis IA",
        description: error.message || 'No se pudo generar el análisis',
        variant: "destructive",
      });
      return null;
    } finally {
      setAiLoading(false);
    }
  };

  const getAIActionPlan = async (diagnosisId: string, diagnosisData: DiagnosisResult, context?: RestaurantContext): Promise<AIActionPlan | null> => {
    console.log('🎯 Generating AI Action Plan...');
    setAiLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('maturity-ai-engine', {
        body: {
          action: 'generate_action_plan',
          diagnosisData: {
            pillarScores: diagnosisData.pillarScores,
            overallScore: diagnosisData.overallScore,
            overallLevel: diagnosisData.overallLevel,
            answers: {}
          },
          restaurantContext: context
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      console.log('✅ AI Action Plan received:', data.data);

      // Save to database
      await supabase
        .from('maturity_diagnoses')
        .update({ ai_action_plan: data.data })
        .eq('id', diagnosisId);

      return data.data as AIActionPlan;
    } catch (error: any) {
      console.error('❌ Error generating action plan:', error);
      toast({
        title: "Error en plan de acción",
        description: error.message || 'No se pudo generar el plan',
        variant: "destructive",
      });
      return null;
    } finally {
      setAiLoading(false);
    }
  };

  const getBenchmarkComparison = async (diagnosisId: string, diagnosisData: DiagnosisResult, context?: RestaurantContext): Promise<AIBenchmark | null> => {
    console.log('📊 Generating Benchmark Comparison...');
    setAiLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('maturity-ai-engine', {
        body: {
          action: 'benchmark_comparison',
          diagnosisData: {
            pillarScores: diagnosisData.pillarScores,
            overallScore: diagnosisData.overallScore,
            overallLevel: diagnosisData.overallLevel,
            answers: {}
          },
          restaurantContext: context
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      console.log('✅ Benchmark received:', data.data);

      // Save to database
      await supabase
        .from('maturity_diagnoses')
        .update({ ai_benchmark: data.data })
        .eq('id', diagnosisId);

      return data.data as AIBenchmark;
    } catch (error: any) {
      console.error('❌ Error generating benchmark:', error);
      toast({
        title: "Error en benchmark",
        description: error.message || 'No se pudo generar la comparación',
        variant: "destructive",
      });
      return null;
    } finally {
      setAiLoading(false);
    }
  };

  const getLastDiagnosis = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('maturity_diagnoses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      return data;
    } catch (error: any) {
      console.error('Error loading diagnosis:', error);
      toast({
        title: "Error al cargar diagnóstico",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateActionTracking = async (
    diagnosisId: string, 
    actionId: string, 
    actionTitle: string,
    pillarId: string,
    priority: 'high' | 'medium' | 'low',
    status: 'pending' | 'in_progress' | 'completed' | 'skipped',
    userId: string,
    notes?: string
  ) => {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'in_progress' && !notes) {
        updateData.started_at = new Date().toISOString();
      }
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
      if (notes) {
        updateData.notes = notes;
      }

      // First try to find existing record
      const { data: existing } = await supabase
        .from('maturity_action_tracking')
        .select('id')
        .eq('diagnosis_id', diagnosisId)
        .eq('action_id', actionId)
        .maybeSingle();

      let result;
      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('maturity_action_tracking')
          .update(updateData)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('maturity_action_tracking')
          .insert({
            diagnosis_id: diagnosisId,
            action_id: actionId,
            action_title: actionTitle,
            pillar_id: pillarId,
            priority,
            user_id: userId,
            ...updateData
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      return result;
    } catch (error: any) {
      console.error('Error updating action tracking:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el progreso",
        variant: "destructive",
      });
      return null;
    }
  };

  const getActionTracking = async (diagnosisId: string) => {
    try {
      const { data, error } = await supabase
        .from('maturity_action_tracking')
        .select('*')
        .eq('diagnosis_id', diagnosisId);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error loading action tracking:', error);
      return [];
    }
  };

  return {
    loading,
    aiLoading,
    calculateScores,
    saveDiagnosis,
    getLastDiagnosis,
    generateAIAnalysis,
    getAIActionPlan,
    getBenchmarkComparison,
    updateActionTracking,
    getActionTracking
  };
};
