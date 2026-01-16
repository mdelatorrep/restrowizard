import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDataUserId } from './useDataUserId';

export interface RestaurantBrand {
  id: string;
  user_id: string;
  brand_name: string;
  logo_url: string | null;
  tagline: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_primary: string;
  font_secondary: string;
  brand_voice: string | null;
  brand_values: string[];
  brand_manual_url: string | null;
  social_links: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface BrandAsset {
  id: string;
  brand_id: string;
  asset_type: string;
  asset_name: string | null;
  asset_url: string | null;
  ai_generated: boolean;
  prompt_used: string | null;
  created_at: string;
}

export const useBrandData = () => {
  const [brand, setBrand] = useState<RestaurantBrand | null>(null);
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const { toast } = useToast();
  const { userId } = useDataUserId();

  const fetchBrand = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurant_brands')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setBrand(data as unknown as RestaurantBrand);
        setHasData(true);
        
        // Fetch assets
        const { data: assetsData } = await supabase
          .from('brand_assets')
          .select('*')
          .eq('brand_id', data.id)
          .order('created_at', { ascending: false });
        
        setAssets((assetsData || []) as unknown as BrandAsset[]);
      } else {
        setHasData(false);
      }
    } catch (error) {
      console.error('Error fetching brand:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBrand = async (brandData: Partial<RestaurantBrand>) => {
    if (!userId) return null;
    
    try {
      const { data, error } = await supabase
        .from('restaurant_brands')
        .insert([{ ...brandData, user_id: userId }])
        .select()
        .single();

      if (error) throw error;
      
      toast({ title: 'Marca creada', description: 'Tu marca ha sido configurada exitosamente' });
      await fetchBrand();
      return data;
    } catch (error) {
      console.error('Error creating brand:', error);
      toast({ title: 'Error', description: 'No se pudo crear la marca', variant: 'destructive' });
      return null;
    }
  };

  const updateBrand = async (updates: Partial<RestaurantBrand>) => {
    if (!brand?.id) return null;
    
    try {
      const { data, error } = await supabase
        .from('restaurant_brands')
        .update(updates)
        .eq('id', brand.id)
        .select()
        .single();

      if (error) throw error;
      
      toast({ title: 'Marca actualizada', description: 'Los cambios han sido guardados' });
      await fetchBrand();
      return data;
    } catch (error) {
      console.error('Error updating brand:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar la marca', variant: 'destructive' });
      return null;
    }
  };

  const addAsset = async (asset: Omit<BrandAsset, 'id' | 'brand_id' | 'created_at'>) => {
    if (!brand?.id) return null;
    
    try {
      const { data, error } = await supabase
        .from('brand_assets')
        .insert([{ ...asset, brand_id: brand.id }])
        .select()
        .single();

      if (error) throw error;
      
      await fetchBrand();
      return data;
    } catch (error) {
      console.error('Error adding asset:', error);
      toast({ title: 'Error', description: 'No se pudo agregar el asset', variant: 'destructive' });
      return null;
    }
  };

  useEffect(() => {
    fetchBrand();
  }, [userId]);

  return {
    brand,
    assets,
    loading,
    hasData,
    createBrand,
    updateBrand,
    addAsset,
    refetch: fetchBrand,
  };
};
