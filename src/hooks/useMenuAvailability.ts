import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';
import { qk } from '@/lib/queryKeys';

/**
 * BL-07 / C9-01: Devuelve un Set con los menu_item_id cuyo platillo NO puede
 * producirse porque algún ingrediente obligatorio de su receta no alcanza la
 * cantidad requerida (ajustada por rendimiento).
 *
 * El cálculo vive en el servidor (menu_out_of_stock_ids): el cajero no tiene
 * permiso para leer inventario ni costos, y calcularlo en el cliente marcaba
 * toda la carta como agotada para él.
 */
export const useMenuAvailability = () => {
  const { userId, isResolved } = useDataUserId();

  const { data, isLoading } = useQuery({
    queryKey: qk.menus.availability(userId),
    enabled: !!userId && isResolved,
    queryFn: async (): Promise<Set<string>> => {
      const { data: ids, error } = await (supabase as any).rpc('menu_out_of_stock_ids', { p_owner: userId });
      if (error) throw error;
      return new Set<string>(((ids as unknown[]) || []).map((row) =>
        typeof row === 'string' ? row : String((row as Record<string, unknown>).menu_out_of_stock_ids),
      ));
    },
  });

  return { outOfStockIds: data ?? new Set<string>(), loading: isLoading };
};
