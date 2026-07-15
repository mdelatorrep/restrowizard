import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';
import { toast } from 'sonner';
import { qk } from '@/lib/queryKeys';

export interface UnitConversion {
  id: string;
  from_unit_id: string;
  to_unit_id: string;
  conversion_factor: number;
  ingredient_id: string | null;
  user_id: string | null;
  notes: string | null;
  from_unit?: { id: string; name: string; abbreviation: string } | null;
  to_unit?: { id: string; name: string; abbreviation: string } | null;
  ingredient?: { id: string; item_name: string } | null;
}

export const useUnitConversions = () => {
  const { userId } = useDataUserId();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: qk.inventory.conversions(userId),
    queryFn: async (): Promise<UnitConversion[]> => {
      const { data, error } = await supabase
        .from('unit_conversions')
        .select(`*, from_unit:measurement_units!from_unit_id(id, name, abbreviation), to_unit:measurement_units!to_unit_id(id, name, abbreviation), ingredient:inventory_items(id, item_name)`)
        .order('created_at', { ascending: false });
      if (error) console.error('unit_conversions:', error);
      return (data as any) || [];
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk.inventory.conversions(userId) });

  const addConversion = async (input: {
    from_unit_id: string; to_unit_id: string; conversion_factor: number; ingredient_id?: string | null; notes?: string;
  }) => {
    if (!userId) return;
    if (input.from_unit_id === input.to_unit_id) { toast.error('Las unidades deben ser distintas'); return; }
    if (!(input.conversion_factor > 0)) { toast.error('El factor debe ser mayor a 0'); return; }
    const { error } = await supabase.from('unit_conversions').insert({
      from_unit_id: input.from_unit_id,
      to_unit_id: input.to_unit_id,
      conversion_factor: input.conversion_factor,
      ingredient_id: input.ingredient_id || null,
      notes: input.notes || null,
      user_id: userId,
    });
    if (error) { toast.error(error.message.includes('duplicate') ? 'Ya existe esa conversión' : 'No se pudo guardar'); return; }
    toast.success('Conversión guardada');
    await invalidate();
  };

  const removeConversion = async (id: string) => {
    const { error } = await supabase.from('unit_conversions').delete().eq('id', id);
    if (error) { toast.error('No se pudo eliminar'); return; }
    await invalidate();
  };

  const convertAmount = async (
    amount: number, fromUnitId: string, toUnitId: string, ingredientId?: string | null,
  ): Promise<number | null> => {
    const { data, error } = await supabase.rpc('convert_unit', {
      p_amount: amount, p_from_unit_id: fromUnitId, p_to_unit_id: toUnitId, p_ingredient_id: ingredientId || null,
    });
    if (error) { console.error('convert_unit:', error); return null; }
    return data === null ? null : Number(data);
  };

  return { conversions: data ?? [], loading: isLoading, addConversion, removeConversion, convertAmount, refetch };
};
