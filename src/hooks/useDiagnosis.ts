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
      const { data, error } = await supabase
        .from('maturity_diagnoses')
        .insert({
          user_id: userId,
          answers,
          pillar_scores: result.pillarScores,
          overall_score: result.overallScore,
          overall_level: dbLevel as 'inicial' | 'basico' | 'intermedio' | 'avanzado' | 'experto'
        })
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

      return result;
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

  return {
    loading,
    calculateScores,
    saveDiagnosis,
    getLastDiagnosis
  };
};