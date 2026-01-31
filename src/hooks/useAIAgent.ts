import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AIAgentRequest {
  module: 'finances' | 'talent' | 'operations' | 'menu-inventory' | 'sustainability' | 'suppliers' | 'inventory' | 'delivery' | 'loyalty' | 'reservations' | 'staff-schedule' | 'recipes';
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

  // Finance module functions
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

  // Talent module functions
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

  // Operations module functions
  const getCustomerInsights = async (customerData: any) => {
    return await callAIAgent({
      module: 'operations',
      action: 'customer_insights',
      data: customerData
    });
  };

  const analyzeOperations = async (operationsData: any) => {
    return await callAIAgent({
      module: 'operations',
      action: 'customer_insights',
      data: operationsData
    });
  };

  // Menu & Inventory module functions
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

  // Sustainability module functions
  const analyzeSustainability = async (sustainabilityData: any) => {
    return await callAIAgent({
      module: 'sustainability',
      action: 'sustainability_analysis',
      data: sustainabilityData
    });
  };

  // ====== SUPPLIERS MODULE ======
  const analyzeSuppliers = async (supplierData: any) => {
    return await callAIAgent({
      module: 'suppliers',
      action: 'supplier_analysis',
      data: supplierData
    });
  };

  const getSupplierNegotiationTips = async (supplierData: any) => {
    return await callAIAgent({
      module: 'suppliers',
      action: 'supplier_negotiation',
      data: supplierData
    });
  };

  const findAlternativeSuppliers = async (productData: any) => {
    return await callAIAgent({
      module: 'suppliers',
      action: 'alternative_suppliers',
      data: productData
    });
  };

  // ====== INVENTORY MODULE ======
  const optimizeReorders = async (inventoryData: any) => {
    return await callAIAgent({
      module: 'inventory',
      action: 'reorder_optimization',
      data: inventoryData
    });
  };

  const predictExpiry = async (inventoryData: any) => {
    return await callAIAgent({
      module: 'inventory',
      action: 'expiry_prediction',
      data: inventoryData
    });
  };

  const analyzeCostTrends = async (inventoryData: any) => {
    return await callAIAgent({
      module: 'inventory',
      action: 'cost_trend_analysis',
      data: inventoryData
    });
  };

  // ====== DELIVERY MODULE ======
  const forecastDeliveryDemand = async (deliveryData: any) => {
    return await callAIAgent({
      module: 'delivery',
      action: 'demand_forecast',
      data: deliveryData
    });
  };

  const optimizeDelivery = async (deliveryData: any) => {
    return await callAIAgent({
      module: 'delivery',
      action: 'delivery_optimization',
      data: deliveryData
    });
  };

  const analyzeDriverPerformance = async (driverData: any) => {
    return await callAIAgent({
      module: 'delivery',
      action: 'driver_performance',
      data: driverData
    });
  };

  // ====== LOYALTY MODULE ======
  const preventChurn = async (customerData: any) => {
    return await callAIAgent({
      module: 'loyalty',
      action: 'churn_prevention',
      data: customerData
    });
  };

  const getLoyaltyRecommendations = async (programData: any) => {
    return await callAIAgent({
      module: 'loyalty',
      action: 'loyalty_recommendations',
      data: programData
    });
  };

  const generatePersonalizedOffers = async (customerData: any) => {
    return await callAIAgent({
      module: 'loyalty',
      action: 'personalized_offers',
      data: customerData
    });
  };

  const optimizeLTV = async (customerData: any) => {
    return await callAIAgent({
      module: 'loyalty',
      action: 'ltv_optimization',
      data: customerData
    });
  };

  return {
    loading,
    callAIAgent,
    // Finance
    analyzeFinances,
    detectCostAnomalies,
    optimizePricing,
    // Talent
    optimizeStaff,
    analyzeCandidates,
    // Operations
    getCustomerInsights,
    analyzeOperations,
    // Menu & Inventory
    analyzeMenu,
    predictInventory,
    // Sustainability
    analyzeSustainability,
    // Suppliers
    analyzeSuppliers,
    getSupplierNegotiationTips,
    findAlternativeSuppliers,
    // Inventory
    optimizeReorders,
    predictExpiry,
    analyzeCostTrends,
    // Delivery
    forecastDeliveryDemand,
    optimizeDelivery,
    analyzeDriverPerformance,
    // Loyalty
    preventChurn,
    getLoyaltyRecommendations,
    generatePersonalizedOffers,
    optimizeLTV
  };
};