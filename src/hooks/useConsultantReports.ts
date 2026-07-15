import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useConsultantProfile } from './useConsultantProfile';
import { qk } from '@/lib/queryKeys';

interface Report {
  id: string;
  consultant_id: string;
  client_id: string | null;
  report_title: string;
  report_type: string;
  content: Record<string, any> | null;
  recommendations: any[] | null;
  is_shared_with_client: boolean;
  created_at: string;
  // Joined data
  business_name?: string;
}

export const useConsultantReports = () => {
  const { profile } = useConsultantProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);

  const { data: reports = [], isLoading: loading } = useQuery({
    queryKey: qk.consultant.reports(profile?.id),
    enabled: !!profile?.id,
    queryFn: async (): Promise<Report[]> => {
      const { data, error } = await supabase
        .from('consultant_reports')
        .select(`
          *,
          consultant_clients (
            client_user_id
          )
        `)
        .eq('consultant_id', profile!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich with business names
      const enrichedReports = await Promise.all(
        (data || []).map(async (report: any) => {
          if (report.consultant_clients?.client_user_id) {
            const { data: businessData } = await supabase
              .from('restaurant_businesses')
              .select('name')
              .eq('owner_id', report.consultant_clients.client_user_id)
              .single();

            return {
              ...report,
              business_name: businessData?.name || 'Cliente'
            };
          }
          return { ...report, business_name: null };
        })
      );

      return enrichedReports as Report[];
    },
  });

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: qk.consultant.reports(profile?.id) }),
    [queryClient, profile?.id]
  );

  const generateReport = async (clientId: string, reportType: string, title: string) => {
    if (!profile?.id) return { error: 'No profile found' };

    setGenerating(true);
    try {
      // Get client data for AI analysis
      const { data: clientData } = await supabase
        .from('consultant_clients')
        .select('client_user_id')
        .eq('id', clientId)
        .single();

      if (!clientData) throw new Error('Client not found');

      // Get client's diagnosis and business data
      const { data: diagnosisData } = await supabase
        .from('maturity_diagnoses')
        .select('*')
        .eq('user_id', clientData.client_user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const { data: businessData } = await supabase
        .from('restaurant_businesses')
        .select('*')
        .eq('owner_id', clientData.client_user_id)
        .single();

      // Call AI to generate report
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('ai-restaurant-agent', {
        body: {
          module: reportType === 'financial' ? 'finances' :
                  reportType === 'operations' ? 'operations' :
                  reportType === 'maturity' ? 'operations' : 'finances',
          action: 'analyze_profitability',
          data: {
            diagnosis: diagnosisData,
            business: businessData,
            report_type: reportType
          }
        }
      });

      const recommendations = aiResponse?.analysis ? [
        { text: aiResponse.analysis, priority: 'high' }
      ] : [];

      // Save report
      const { data: report, error } = await supabase
        .from('consultant_reports')
        .insert({
          consultant_id: profile.id,
          client_id: clientId,
          report_title: title,
          report_type: reportType,
          content: {
            diagnosis: diagnosisData,
            business: businessData,
            ai_analysis: aiResponse?.analysis || null,
            generated_at: new Date().toISOString()
          },
          recommendations: recommendations,
          is_shared_with_client: false
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Reporte generado", description: "El análisis IA ha sido completado." });
      await invalidate();
      return { data: report, error: null };
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return { error: error.message };
    } finally {
      setGenerating(false);
    }
  };

  const shareWithClient = async (reportId: string, share: boolean) => {
    try {
      const { error } = await supabase
        .from('consultant_reports')
        .update({ is_shared_with_client: share })
        .eq('id', reportId);

      if (error) throw error;

      await invalidate();
      toast({ title: share ? "Reporte compartido" : "Reporte ocultado" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const deleteReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('consultant_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      await invalidate();
      toast({ title: "Reporte eliminado" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return {
    reports,
    loading,
    generating,
    generateReport,
    shareWithClient,
    deleteReport,
    refetch: invalidate
  };
};
