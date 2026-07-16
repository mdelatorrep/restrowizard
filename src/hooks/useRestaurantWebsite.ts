import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';
import type { TablesUpdate } from '@/integrations/supabase/types';

export interface WebsiteTemplate {
  id: string;
  name: string;
  description: string | null;
  preview_image: string | null;
  layout_type: string;
  default_config: Record<string, unknown>;
  is_active: boolean;
}

export interface RestaurantWebsite {
  id: string;
  user_id: string;
  slug: string;
  template_id: string | null;
  is_published: boolean;
  site_title: string | null;
  meta_description: string | null;
  favicon_url: string | null;
  show_menu: boolean;
  show_delivery: boolean;
  show_reservations: boolean;
  show_contact: boolean;
  show_gallery: boolean;
  show_reviews: boolean;
  show_loyalty: boolean;
  show_about: boolean;
  business_hours: Record<string, { open: string; close: string; closed?: boolean }>;
  hero_image_url: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_cta_text: string | null;
  hero_cta_link: string | null;
  about_title: string | null;
  about_description: string | null;
  about_image_url: string | null;
  gallery_images: string[];
  theme_overrides: Record<string, unknown>;
  delivery_min_order: number | null;
  delivery_message: string | null;
  reservation_max_party_size: number;
  reservation_advance_days: number;
  reservation_slot_duration: number;
  reservation_available_times: string[];
  google_analytics_id: string | null;
  custom_scripts: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicWebsiteData extends RestaurantWebsite {
  brand?: {
    brand_name: string | null;
    primary_color: string | null;
    secondary_color: string | null;
    accent_color: string | null;
    primary_font: string | null;
    secondary_font: string | null;
    logo_url: string | null;
    tagline: string | null;
    social_links: Record<string, string>;
  };
  profile?: {
    restaurant_name: string | null;
    phone: string | null;
    address: string | null;
  };
}

export function useRestaurantWebsite() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [website, setWebsite] = useState<RestaurantWebsite | null>(null);
  const [templates, setTemplates] = useState<WebsiteTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWebsite = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('restaurant_websites')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setWebsite({
          ...data,
          business_hours: (data.business_hours as Record<string, { open: string; close: string; closed?: boolean }>) || {},
          gallery_images: (data.gallery_images as string[]) || [],
          theme_overrides: (data.theme_overrides as Record<string, unknown>) || {},
          reservation_available_times: (data.reservation_available_times as string[]) || [],
        });
      }
    } catch (error) {
      console.error('Error fetching website:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('website_templates')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      
      setTemplates((data || []).map(t => ({
        ...t,
        default_config: (t.default_config as Record<string, unknown>) || {},
      })));
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchWebsite(), fetchTemplates()]);
      setLoading(false);
    };
    
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const createWebsite = async (slug: string, templateId?: string) => {
    if (!user?.id) return null;
    
    try {
      // Check if slug is available
      const { data: existing } = await supabase
        .from('restaurant_websites')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      
      if (existing) {
        toast({
          title: "Slug no disponible",
          description: "Este nombre de URL ya está en uso. Elige otro.",
          variant: "destructive",
        });
        return null;
      }
      
      // Seed title/hero from brand or restaurant profile so the public site
      // shows the real restaurant name instead of the generic "Restaurante".
      const [{ data: brandRow }, { data: profileRow }] = await Promise.all([
        supabase
          .from('restaurant_brands')
          .select('brand_name')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('restaurant_name')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);
      const restaurantName =
        (brandRow?.brand_name as string | null) ||
        (profileRow?.restaurant_name as string | null) ||
        null;

      const { data, error } = await supabase
        .from('restaurant_websites')
        .insert({
          user_id: user.id,
          slug,
          template_id: templateId || null,
          site_title: restaurantName,
          hero_title: restaurantName,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      const newWebsite = {
        ...data,
        business_hours: {},
        gallery_images: [],
        theme_overrides: {},
        reservation_available_times: [],
      };
      
      setWebsite(newWebsite);
      
      toast({
        title: "Sitio web creado (borrador)",
        description: `Pulsa "Publicar" para que sea visible en ${window.location.origin}/p/${slug}`,
      });
      
      return newWebsite;
    } catch (error) {
      console.error('Error creating website:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el sitio web",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateWebsite = async (updates: Partial<RestaurantWebsite>) => {
    if (!website?.id) return false;
    
    try {
      // Convert to DB-compatible format
      const dbUpdates: TablesUpdate<'restaurant_websites'> = { ...updates } as TablesUpdate<'restaurant_websites'>;
      if (updates.business_hours) dbUpdates.business_hours = updates.business_hours as Json;
      if (updates.gallery_images) dbUpdates.gallery_images = updates.gallery_images as Json;
      if (updates.theme_overrides) dbUpdates.theme_overrides = updates.theme_overrides as Json;
      if (updates.reservation_available_times) dbUpdates.reservation_available_times = updates.reservation_available_times as Json;
      
      const { error } = await supabase
        .from('restaurant_websites')
        .update(dbUpdates)
        .eq('id', website.id);
      
      if (error) throw error;
      
      setWebsite(prev => prev ? { ...prev, ...updates } : null);
      
      toast({
        title: "Guardado",
        description: "Los cambios han sido guardados",
      });
      
      return true;
    } catch (error) {
      console.error('Error updating website:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      });
      return false;
    }
  };

  const publishWebsite = async (publish: boolean) => {
    return updateWebsite({ is_published: publish });
  };

  const checkSlugAvailability = async (slug: string): Promise<boolean> => {
    const { data } = await supabase
      .from('restaurant_websites')
      .select('id')
      .eq('slug', slug)
      .neq('id', website?.id || '')
      .maybeSingle();
    
    return !data;
  };

  return {
    website,
    templates,
    loading,
    createWebsite,
    updateWebsite,
    publishWebsite,
    checkSlugAvailability,
    refetch: fetchWebsite,
  };
}

// Hook for fetching public website data
export function usePublicWebsite(slug: string) {
  const [data, setData] = useState<PublicWebsiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch website
        const { data: websiteData, error: websiteError } = await supabase
          .from('restaurant_websites')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .maybeSingle();
        
        if (websiteError) throw websiteError;
        if (!websiteData) {
          setError('not_found');
          setLoading(false);
          return;
        }
        
        // Fetch brand
        const { data: brandData } = await supabase
          .from('restaurant_brands')
          .select('brand_name, primary_color, secondary_color, accent_color, logo_url, tagline, social_links')
          .eq('user_id', websiteData.user_id)
          .maybeSingle();
        
        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('restaurant_name, phone')
          .eq('user_id', websiteData.user_id)
          .maybeSingle();
        
        setData({
          ...websiteData,
          business_hours: (websiteData.business_hours as Record<string, { open: string; close: string; closed?: boolean }>) || {},
          gallery_images: (websiteData.gallery_images as string[]) || [],
          theme_overrides: (websiteData.theme_overrides as Record<string, unknown>) || {},
          reservation_available_times: (websiteData.reservation_available_times as string[]) || [],
          brand: brandData ? {
            brand_name: brandData.brand_name,
            primary_color: brandData.primary_color,
            secondary_color: brandData.secondary_color,
            accent_color: brandData.accent_color,
            primary_font: null,
            secondary_font: null,
            logo_url: brandData.logo_url,
            tagline: brandData.tagline,
            social_links: (brandData.social_links as Record<string, string>) || {},
          } : undefined,
          profile: profileData ? { ...profileData, address: null } : undefined,
        });
      } catch (err) {
        console.error('Error fetching public website:', err);
        setError('error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [slug]);

  return { data, loading, error };
}
