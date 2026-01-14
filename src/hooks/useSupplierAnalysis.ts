import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDataUserId } from './useDataUserId';

export interface SupplierAlternative {
  name: string;
  type: 'central_abastos' | 'mayorista' | 'distribuidor' | 'productor';
  estimated_price: number | null;
  unit: string;
  savings_percent: number;
  contact: {
    phone?: string;
    address?: string;
    hours?: string;
    email?: string;
  };
  source: string;
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
}

export interface SupplierAnalysisResult {
  id: string;
  inventory_item_id: string | null;
  item_name: string;
  current_cost: number | null;
  current_supplier: string | null;
  city: string;
  country: string | null;
  alternatives: SupplierAlternative[];
  market_insights: string | null;
  recommendations: string[] | null;
  potential_savings: number | null;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  error_message: string | null;
  analysis_date: string;
  created_at: string;
}

interface AnalyzeSupplierParams {
  itemName: string;
  currentCost: number;
  currentSupplier?: string;
  unit: string;
  city: string;
  country?: string;
  inventoryItemId?: string;
}

export const useSupplierAnalysis = () => {
  const { userId } = useDataUserId();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [analyzing, setAnalyzing] = useState(false);

  // Fetch analysis history
  const { data: analysisHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['supplier-analysis', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('supplier_analysis')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        alternatives: (item.alternatives as unknown as SupplierAlternative[]) || [],
      })) as SupplierAnalysisResult[];
    },
    enabled: !!userId,
  });

  // Analyze a single supplier
  const analyzeSupplier = async (params: AnalyzeSupplierParams): Promise<SupplierAnalysisResult | null> => {
    if (!userId) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para analizar proveedores",
        variant: "destructive",
      });
      return null;
    }

    setAnalyzing(true);

    try {
      // Create a pending analysis record
      const { data: analysisRecord, error: insertError } = await supabase
        .from('supplier_analysis')
        .insert({
          user_id: userId,
          inventory_item_id: params.inventoryItemId || null,
          item_name: params.itemName,
          current_cost: params.currentCost,
          current_supplier: params.currentSupplier || null,
          city: params.city,
          country: params.country || 'México',
          status: 'analyzing',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Call the edge function
      const { data: functionData, error: functionError } = await supabase.functions.invoke('supplier-analyzer', {
        body: {
          itemName: params.itemName,
          currentCost: params.currentCost,
          currentSupplier: params.currentSupplier,
          unit: params.unit,
          city: params.city,
          country: params.country || 'México',
        },
      });

      if (functionError) throw functionError;

      if (!functionData.success) {
        throw new Error(functionData.error || 'Error en el análisis');
      }

      const analysis = functionData.analysis;

      // Update the record with results
      const { data: updatedRecord, error: updateError } = await supabase
        .from('supplier_analysis')
        .update({
          alternatives: analysis.suppliers || [],
          market_insights: analysis.market_insights,
          recommendations: analysis.recommendations,
          potential_savings: analysis.potential_savings,
          status: 'completed',
        })
        .eq('id', analysisRecord.id)
        .select()
        .single();

      if (updateError) throw updateError;

      toast({
        title: "Análisis completado",
        description: `Se encontraron ${analysis.suppliers?.length || 0} proveedores alternativos`,
      });

      queryClient.invalidateQueries({ queryKey: ['supplier-analysis', userId] });

      return {
        ...updatedRecord,
        alternatives: (updatedRecord.alternatives as unknown as SupplierAlternative[]) || [],
      } as SupplierAnalysisResult;

    } catch (error: any) {
      console.error('Supplier analysis error:', error);
      toast({
        title: "Error en el análisis",
        description: error.message || "No se pudo completar el análisis de proveedores",
        variant: "destructive",
      });
      return null;
    } finally {
      setAnalyzing(false);
    }
  };

  // Bulk analyze multiple items
  const bulkAnalyze = async (items: AnalyzeSupplierParams[]): Promise<SupplierAnalysisResult[]> => {
    const results: SupplierAnalysisResult[] = [];
    
    for (const item of items) {
      const result = await analyzeSupplier(item);
      if (result) {
        results.push(result);
      }
      // Add a small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  };

  // Delete an analysis record
  const deleteAnalysis = useMutation({
    mutationFn: async (analysisId: string) => {
      const { error } = await supabase
        .from('supplier_analysis')
        .delete()
        .eq('id', analysisId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-analysis', userId] });
      toast({
        title: "Análisis eliminado",
        description: "El registro de análisis ha sido eliminado",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el análisis",
        variant: "destructive",
      });
    },
  });

  return {
    analysisHistory: analysisHistory || [],
    historyLoading,
    analyzing,
    analyzeSupplier,
    bulkAnalyze,
    deleteAnalysis: deleteAnalysis.mutate,
  };
};