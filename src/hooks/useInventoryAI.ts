import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useAIAgent } from '@/hooks/useAIAgent';
import type { InventoryItemExtended } from '@/hooks/useEnterpriseInventory';

interface KPIs {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  expiringItems: number;
  belowParItems: number;
}

/**
 * Encapsulates the AI insights flow for the Inventory module:
 * - validates input
 * - calls optimizeReorders
 * - holds insights + open/close state for the panel
 */
export const useInventoryAI = () => {
  const { optimizeReorders, loading } = useAIAgent();
  const [insights, setInsights] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const analyze = useCallback(async (
    inventory: InventoryItemExtended[],
    kpis: KPIs | null | undefined,
  ) => {
    if (!inventory || inventory.length === 0) {
      toast.error('Agrega items al inventario para poder analizarlos');
      return;
    }
    const payload = inventory.map(item => ({
      nombre: item.item_name,
      categoria: item.category,
      stock_actual: item.current_stock,
      par_level: item.par_level,
      punto_reorden: item.reorder_point,
      costo_unitario: item.unit_cost,
      unidad: item.unit,
      proveedor: item.supplier_name,
      vencimiento: item.expiration_date,
    }));

    const result = await optimizeReorders({
      items: payload,
      total_items: kpis?.totalItems || 0,
      valor_total: kpis?.totalValue || 0,
      items_stock_bajo: kpis?.lowStockItems || 0,
      items_agotados: kpis?.outOfStockItems || 0,
      items_por_vencer: kpis?.expiringItems || 0,
      items_bajo_par: kpis?.belowParItems || 0,
    });

    if (result) {
      setInsights(result);
      setOpen(true);
    }
  }, [optimizeReorders]);

  return {
    insights,
    open,
    loading,
    analyze,
    close: () => setOpen(false),
  };
};
