import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useDashboard = () => {
  const [hasDiagnosis, setHasDiagnosis] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const checkUserDiagnosis = async (userId: string) => {
    console.log('🔬 checkUserDiagnosis called with userId:', userId);
    
    try {
      setLoading(true);
      console.log('🔍 Querying maturity_diagnoses table...');
      
      // Add timeout to prevent hanging
      const queryPromise = supabase
        .from('maturity_diagnoses')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000)
      );

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      console.log('📊 Supabase query result:', { data, error });

      if (error) {
        console.error('❌ Error checking diagnosis:', error);
        setHasDiagnosis(false);
        return false;
      }

      const hasCompletedDiagnosis = !!data;
      console.log('✅ Diagnosis check completed:', hasCompletedDiagnosis);
      
      setHasDiagnosis(hasCompletedDiagnosis);
      return hasCompletedDiagnosis;
    } catch (error) {
      console.error('💥 Error in checkUserDiagnosis:', error);
      setHasDiagnosis(false);
      return false;
    } finally {
      console.log('🏁 Setting loading to false');
      setLoading(false);
    }
  };

  return {
    hasDiagnosis,
    loading,
    checkUserDiagnosis,
  };
};