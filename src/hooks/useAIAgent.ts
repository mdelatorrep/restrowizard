import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AIAgentRequest {
  module: 'finances' | 'talent' | 'operations' | 'menu-inventory';
  action: string;
  data: any;
}

export interface AIAgentResponse {
  analysis: string;
  success: boolean;
  error?: string;
}

export const useAIAgent = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const callAIAgent = async (request: AIAgentRequest): Promise<string | null> => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-restaurant-agent', {
        body: request
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Error en el análisis del agente IA');
      }

      return data.analysis;
    } catch (error: any) {
      console.error('Error calling AI agent:', error);
      toast({
        title: "Error en análisis IA",
        description: error.message || "No se pudo obtener el análisis del agente IA",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const analyzeFinances = async (financialData: any) => {
    return await callAIAgent({
      module: 'finances',
      action: 'analyze_profitability',
      data: financialData
    });
  };

  const detectCostAnomalies = async (costData: any) => {
    return await callAIAgent({
      module: 'finances',
      action: 'detect_cost_anomalies',
      data: costData
    });
  };

  const optimizePricing = async (menuData: any) => {
    return await callAIAgent({
      module: 'finances',
      action: 'optimize_pricing',
      data: menuData
    });
  };

  const optimizeStaff = async (staffData: any) => {
    return await callAIAgent({
      module: 'talent',
      action: 'staff_optimization',
      data: staffData
    });
  };

  const analyzeCandidates = async (candidatesData: any) => {
    return await callAIAgent({
      module: 'talent',
      action: 'analyze_candidates',
      data: candidatesData
    });
  };

  const getCustomerInsights = async (customerData: any) => {
    return await callAIAgent({
      module: 'operations',
      action: 'customer_insights',
      data: customerData
    });
  };

  const analyzeMenu = async (menuData: any) => {
    return await callAIAgent({
      module: 'menu-inventory',
      action: 'menu_engineering',
      data: menuData
    });
  };

  const predictInventory = async (inventoryData: any) => {
    return await callAIAgent({
      module: 'menu-inventory',
      action: 'inventory_prediction',
      data: inventoryData
    });
  };

  return {
    loading,
    callAIAgent,
    analyzeFinances,
    detectCostAnomalies,
    optimizePricing,
    optimizeStaff,
    analyzeCandidates,
    getCustomerInsights,
    analyzeMenu,
    predictInventory
  };
};