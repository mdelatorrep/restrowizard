import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useDashboard = () => {
  const [hasDiagnosis, setHasDiagnosis] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const checkUserDiagnosis = async (userId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('maturity_diagnoses')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking diagnosis:', error);
        setHasDiagnosis(false);
        return false;
      }

      const hasCompletedDiagnosis = !!data;
      setHasDiagnosis(hasCompletedDiagnosis);
      return hasCompletedDiagnosis;
    } catch (error) {
      console.error('Error in checkUserDiagnosis:', error);
      setHasDiagnosis(false);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    hasDiagnosis,
    loading,
    checkUserDiagnosis,
  };
};