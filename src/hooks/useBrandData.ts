import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDataUserId } from './useDataUserId';
import type { Json } from '@/integrations/supabase/types';
import { createSessionSupabaseClient } from '@/lib/createSessionSupabaseClient';

export interface RestaurantBrand {
  id: string;
  user_id: string;
  brand_name: string;
  logo_url: string | null;
  logo_white_url: string | null;
  logo_dark_url: string | null;
  logo_square_url: string | null;
  favicon_url: string | null;
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
  mission: string | null;
  vision: string | null;
  story: string | null;
  differentiators: string[];
  target_audience: string | null;
  gallery_photos: Array<{
    url: string;
    category: string;
    caption?: string;
    uploadedAt: string;
  }>;
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

  const fetchBrand = useCallback(async () => {
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
        // Parse JSON fields safely
        const parsedBrand: RestaurantBrand = {
          ...data,
          brand_values: Array.isArray(data.brand_values) ? data.brand_values as string[] : [],
          social_links: typeof data.social_links === 'object' && data.social_links !== null 
            ? data.social_links as Record<string, string>
            : {},
          differentiators: Array.isArray(data.differentiators) ? data.differentiators as string[] : [],
          gallery_photos: Array.isArray(data.gallery_photos) 
            ? (data.gallery_photos as Array<{ url: string; category: string; caption?: string; uploadedAt: string }>)
            : [],
        };
        
        setBrand(parsedBrand);
        setHasData(true);
        
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
  }, [userId]);

  const createBrand = async (brandData: { brand_name: string; [key: string]: unknown }) => {
    if (!userId) return null;
    
    try {
      const sessionSupabase = await createSessionSupabaseClient();

      const insertData = {
        brand_name: brandData.brand_name,
        user_id: userId,
        logo_url: brandData.logo_url as string | undefined,
        tagline: brandData.tagline as string | undefined,
        primary_color: brandData.primary_color as string | undefined,
        secondary_color: brandData.secondary_color as string | undefined,
        accent_color: brandData.accent_color as string | undefined,
        font_primary: brandData.font_primary as string | undefined,
        font_secondary: brandData.font_secondary as string | undefined,
        brand_voice: brandData.brand_voice as string | undefined,
        brand_values: (brandData.brand_values ?? null) as Json,
        social_links: (brandData.social_links ?? null) as Json,
        differentiators: (brandData.differentiators ?? null) as Json,
        gallery_photos: (brandData.gallery_photos ?? null) as Json,
      };

      const { data, error } = await sessionSupabase
        .from('restaurant_brands')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Marca creada', description: 'Tu marca ha sido configurada exitosamente' });
      // Optimistic update so the page reflects creation immediately.
      if (data) {
        const parsed: RestaurantBrand = {
          ...(data as any),
          brand_values: Array.isArray((data as any).brand_values) ? (data as any).brand_values : [],
          social_links: typeof (data as any).social_links === 'object' && (data as any).social_links !== null
            ? (data as any).social_links
            : {},
          differentiators: Array.isArray((data as any).differentiators) ? (data as any).differentiators : [],
          gallery_photos: Array.isArray((data as any).gallery_photos) ? (data as any).gallery_photos : [],
        };
        setBrand(parsed);
        setHasData(true);
      }
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
      // Convert arrays to JSON for storage
      const updateData: Record<string, unknown> = { ...updates };
      if (updates.brand_values !== undefined) {
        updateData.brand_values = updates.brand_values as unknown as Json;
      }
      if (updates.social_links !== undefined) {
        updateData.social_links = updates.social_links as unknown as Json;
      }
      if (updates.differentiators !== undefined) {
        updateData.differentiators = updates.differentiators as unknown as Json;
      }
      if (updates.gallery_photos !== undefined) {
        updateData.gallery_photos = updates.gallery_photos as unknown as Json;
      }

      const { data, error } = await supabase
        .from('restaurant_brands')
        .update(updateData)
        .eq('id', brand.id)
        .select()
        .single();

      if (error) throw error;
      
      // Update local state immediately
      setBrand(prev => prev ? { ...prev, ...updates } : null);
      
      toast({ title: 'Cambios guardados', description: 'La marca se ha actualizado' });
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
  }, [fetchBrand]);

  // Realtime: keep admin UI synced when brand is updated from any source.
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`brand-sync-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'restaurant_brands', filter: `user_id=eq.${userId}` },
        () => { fetchBrand(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchBrand]);

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
