import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { qk } from '@/lib/queryKeys';

/**
 * BL-03: Recetas M:N con ítems de menú.
 * Gestiona el pivote `recipe_menu_items` para asociar una receta a
 * múltiples ítems del menú (con variantes opcionales y receta principal).
 */
export interface RecipeMenuLink {
  id: string;
  recipe_id: string;
  menu_item_id: string;
  is_primary: boolean;
  variant_name: string | null;
  sort_order: number;
  menu_item?: { id: string; name: string; category: string | null } | null;
}

export const useRecipeMenuLinks = (recipeId?: string | null) => {
  const queryClient = useQueryClient();

  const { data: links = [], isLoading: loading } = useQuery({
    queryKey: qk.recipes.menuLinks(recipeId),
    enabled: !!recipeId,
    queryFn: async (): Promise<RecipeMenuLink[]> => {
      const { data, error } = await supabase
        .from('recipe_menu_items')
        .select('*, menu_item:menu_items(id, name, category)')
        .eq('recipe_id', recipeId!)
        .order('sort_order');
      if (error) {
        console.error(error);
        toast.error('No se pudieron cargar los ítems de menú vinculados');
        throw error;
      }
      return (data as any) || [];
    },
  });

  const refetch = useCallback(
    () => queryClient.invalidateQueries({ queryKey: qk.recipes.menuLinks(recipeId) }),
    [queryClient, recipeId]
  );

  const addLink = async (menuItemId: string, variantName?: string, isPrimary = false) => {
    if (!recipeId) return;
    // Si se marca como primary, primero desmarcamos cualquier otra primary del mismo menu_item
    if (isPrimary) {
      await supabase.from('recipe_menu_items')
        .update({ is_primary: false })
        .eq('menu_item_id', menuItemId)
        .eq('is_primary', true);
    }
    const { error } = await supabase.from('recipe_menu_items').insert({
      recipe_id: recipeId,
      menu_item_id: menuItemId,
      variant_name: variantName || null,
      is_primary: isPrimary,
      sort_order: links.length,
    });
    if (error) {
      toast.error(error.message.includes('duplicate') ? 'Ya está vinculada a ese ítem' : 'No se pudo vincular');
      return;
    }
    toast.success('Receta vinculada al ítem de menú');
    await refetch();
  };

  const removeLink = async (linkId: string) => {
    const { error } = await supabase.from('recipe_menu_items').delete().eq('id', linkId);
    if (error) { toast.error('No se pudo eliminar el vínculo'); return; }
    toast.success('Vínculo eliminado');
    await refetch();
  };

  const setPrimary = async (linkId: string, menuItemId: string) => {
    await supabase.from('recipe_menu_items')
      .update({ is_primary: false })
      .eq('menu_item_id', menuItemId)
      .eq('is_primary', true);
    const { error } = await supabase.from('recipe_menu_items')
      .update({ is_primary: true })
      .eq('id', linkId);
    if (error) { toast.error('No se pudo marcar como principal'); return; }
    toast.success('Marcada como principal');
    await refetch();
  };

  const updateVariant = async (linkId: string, variantName: string | null) => {
    const { error } = await supabase.from('recipe_menu_items')
      .update({ variant_name: variantName })
      .eq('id', linkId);
    if (error) { toast.error('No se pudo actualizar la variante'); return; }
    await refetch();
  };

  return { links, loading, addLink, removeLink, setPrimary, updateVariant, refetch };
};
