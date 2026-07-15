import { useEffect, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { loadGoogleFonts } from '@/lib/brandFonts';
import { qk } from '@/lib/queryKeys';

export interface PublicRestaurantData {
  website: {
    id: string; user_id: string; slug: string;
    site_title: string | null; meta_description: string | null; is_published: boolean;
    show_menu: boolean; show_delivery: boolean; show_reservations: boolean; show_contact: boolean;
    show_gallery: boolean; show_reviews: boolean; show_loyalty: boolean; show_about: boolean; show_feedback: boolean;
    hero_image_url: string | null; hero_title: string | null; hero_subtitle: string | null;
    hero_cta_text: string | null; hero_cta_link: string | null;
    about_title: string | null; about_description: string | null; about_image_url: string | null;
    gallery_images: string[];
    business_hours: Record<string, { open: string; close: string; closed?: boolean }>;
    delivery_min_order: number | null; delivery_message: string | null;
    reservation_max_party_size: number; reservation_advance_days: number;
    reservation_slot_duration: number; reservation_available_times: string[];
  } | null;
  brand: {
    brand_name: string | null; primary_color: string; secondary_color: string; accent_color: string;
    primary_font: string | null; secondary_font: string | null; logo_url: string | null;
    tagline: string | null; social_links: Record<string, string>;
  };
  profile: { restaurant_name: string | null; phone: string | null; address: string | null } | null;
  restaurantName: string;
  userId: string | null;
}

interface UsePublicRestaurantDataReturn {
  data: PublicRestaurantData | null;
  loading: boolean;
  error: 'not_found' | 'not_published' | 'error' | null;
  brandStyles: CSSProperties;
}

const DEFAULT_BRAND = {
  brand_name: null,
  primary_color: 'hsl(222.2, 84%, 4.9%)',
  secondary_color: 'hsl(210, 40%, 96.1%)',
  accent_color: 'hsl(262.1, 83.3%, 57.8%)',
  primary_font: null,
  secondary_font: null,
  logo_url: null,
  tagline: null,
  social_links: {},
};

export function usePublicRestaurantData(slug: string): UsePublicRestaurantDataReturn {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: qk.public.restaurantData(slug),
    enabled: !!slug,
    retry: false,
    queryFn: async (): Promise<PublicRestaurantData> => {
      const { data: websiteData, error: websiteError } = await supabase.from('restaurant_websites').select('*').eq('slug', slug).maybeSingle();
      if (websiteError) throw websiteError;
      if (!websiteData) throw new Error('not_found');
      if (!websiteData.is_published) throw new Error('not_published');

      const [brandResult, profileResult] = await Promise.all([
        supabase.from('restaurant_brands')
          .select('brand_name, primary_color, secondary_color, accent_color, font_primary, font_secondary, logo_url, tagline, social_links')
          .eq('user_id', websiteData.user_id).maybeSingle(),
        supabase.from('profiles').select('restaurant_name, phone').eq('user_id', websiteData.user_id).maybeSingle(),
      ]);
      const brandData = brandResult.data;
      const profileData = profileResult.data;

      const website = {
        id: websiteData.id, user_id: websiteData.user_id, slug: websiteData.slug,
        site_title: websiteData.site_title, meta_description: websiteData.meta_description, is_published: websiteData.is_published,
        show_menu: websiteData.show_menu, show_delivery: websiteData.show_delivery, show_reservations: websiteData.show_reservations,
        show_contact: websiteData.show_contact, show_gallery: websiteData.show_gallery, show_reviews: websiteData.show_reviews,
        show_loyalty: websiteData.show_loyalty, show_about: websiteData.show_about, show_feedback: websiteData.show_feedback ?? true,
        hero_image_url: websiteData.hero_image_url, hero_title: websiteData.hero_title, hero_subtitle: websiteData.hero_subtitle,
        hero_cta_text: websiteData.hero_cta_text, hero_cta_link: websiteData.hero_cta_link,
        about_title: websiteData.about_title, about_description: websiteData.about_description, about_image_url: websiteData.about_image_url,
        gallery_images: (websiteData.gallery_images as string[]) || [],
        business_hours: (websiteData.business_hours as Record<string, { open: string; close: string; closed?: boolean }>) || {},
        delivery_min_order: websiteData.delivery_min_order, delivery_message: websiteData.delivery_message,
        reservation_max_party_size: websiteData.reservation_max_party_size, reservation_advance_days: websiteData.reservation_advance_days,
        reservation_slot_duration: websiteData.reservation_slot_duration,
        reservation_available_times: (websiteData.reservation_available_times as string[]) || [],
      };

      const brand = brandData ? {
        brand_name: brandData.brand_name,
        primary_color: brandData.primary_color || DEFAULT_BRAND.primary_color,
        secondary_color: brandData.secondary_color || DEFAULT_BRAND.secondary_color,
        accent_color: brandData.accent_color || DEFAULT_BRAND.accent_color,
        primary_font: brandData.font_primary || null,
        secondary_font: brandData.font_secondary || null,
        logo_url: brandData.logo_url,
        tagline: brandData.tagline,
        social_links: (brandData.social_links as Record<string, string>) || {},
      } : DEFAULT_BRAND;

      loadGoogleFonts([brand.primary_font, brand.secondary_font]);

      const profile = profileData ? { restaurant_name: profileData.restaurant_name, phone: profileData.phone, address: null } : null;
      const restaurantName = website.site_title || brand.brand_name || profile?.restaurant_name || 'Restaurante';

      return { website, brand, profile, restaurantName, userId: websiteData.user_id };
    },
  });

  const ownerUserId = data?.userId ?? null;
  useEffect(() => {
    if (!ownerUserId) return;
    const invalidate = () => queryClient.invalidateQueries({ queryKey: qk.public.restaurantData(slug) });
    const channel = supabase
      .channel(`public-restaurant-${ownerUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_brands', filter: `user_id=eq.${ownerUserId}` }, invalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_websites', filter: `user_id=eq.${ownerUserId}` }, invalidate)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ownerUserId, slug, queryClient]);

  const mappedError: 'not_found' | 'not_published' | 'error' | null = !slug
    ? 'not_found'
    : error
      ? (['not_found', 'not_published'].includes((error as Error).message) ? ((error as Error).message as 'not_found' | 'not_published') : 'error')
      : null;

  const brandStyles = useMemo((): CSSProperties => {
    if (!data) return {};
    return {
      '--brand-primary': data.brand.primary_color,
      '--brand-secondary': data.brand.secondary_color,
      '--brand-accent': data.brand.accent_color,
      '--brand-font-primary': data.brand.primary_font || 'system-ui, sans-serif',
      '--brand-font-secondary': data.brand.secondary_font || 'system-ui, sans-serif',
    } as CSSProperties;
  }, [data]);

  return { data: data ?? null, loading: isLoading, error: mappedError, brandStyles };
}
