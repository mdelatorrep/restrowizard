import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { maturityModel, getLevelFromScore } from '@/data/maturityModel';
import { useToast } from '@/hooks/use-toast';

export interface DiagnosisResult {
  pillarScores: Record<string, number>;
  overallScore: number;
  overallLevel: string;
}

export const useDiagnosis = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const calculateScores = (answers: Record<number, number>): DiagnosisResult => {
    const pillarScores: Record<string, { total: number; count: number }> = {};
    
    // Initialize pillar scores
    maturityModel.pillars.forEach(p => {
      pillarScores[p.id] = { total: 0, count: 0 };
    });

    // Calculate scores
    maturityModel.questions.forEach((q, index) => {
      const answerValue = answers[index] || 0;
      pillarScores[q.pillarId].total += answerValue;
      pillarScores[q.pillarId].count++;
    });

    // Calculate averages
    const pillarAverages: Record<string, number> = {};
    let totalScore = 0;
    let totalCount = 0;

    maturityModel.pillars.forEach(p => {
      const avg = pillarScores[p.id].count > 0 
        ? pillarScores[p.id].total / pillarScores[p.id].count 
        : 0;
      pillarAverages[p.id] = avg;
      totalScore += pillarScores[p.id].total;
      totalCount += pillarScores[p.id].count;
    });
    
    const overallAverage = totalCount > 0 ? totalScore / totalCount : 0;
    const overallLevel = getLevelFromScore(overallAverage);

    return {
      pillarScores: pillarAverages,
      overallScore: overallAverage,
      overallLevel: overallLevel.name
    };
  };

  const saveDiagnosis = async (answers: Record<number, number>, userId: string) => {
    setLoading(true);
    
    try {
      const result = calculateScores(answers);
      
      // Map the level name to database enum value
      const levelMapping: Record<string, string> = {
        'INICIAL': 'inicial',
        'BÁSICO': 'basico', 
        'INTERMEDIO': 'intermedio',
        'AVANZADO': 'avanzado',
        'EXPERTO': 'experto'
      };
      
      const dbLevel = levelMapping[result.overallLevel] || 'inicial';
      
      const { error } = await supabase
        .from('maturity_diagnoses')
        .insert({
          user_id: userId,
          answers,
          pillar_scores: result.pillarScores,
          overall_score: result.overallScore,
          overall_level: dbLevel as 'inicial' | 'basico' | 'intermedio' | 'avanzado' | 'experto'
        });

      if (error) throw error;

      toast({
        title: "¡Diagnóstico guardado!",
        description: "Tu evaluación ha sido guardada correctamente.",
      });

      return result;
    } catch (error: any) {
      toast({
        title: "Error al guardar",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
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
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data;
    } catch (error: any) {
      toast({
        title: "Error al cargar diagnóstico",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    loading,
    calculateScores,
    saveDiagnosis,
    getLastDiagnosis
  };
};