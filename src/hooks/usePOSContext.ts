import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { qk } from "@/lib/queryKeys";

export interface POSContext {
  slug: string;
  restaurantUserId: string;
  restaurantName: string;
  brand: {
    primary_color: string;
    accent_color: string;
    secondary_color: string;
    logo_url: string | null;
    brand_name: string | null;
  };
}

interface UsePOSContextReturn {
  context: POSContext | null;
  loading: boolean;
  error: "not_found" | "error" | null;
}

const DEFAULT_BRAND = {
  primary_color: "#3E1064",
  accent_color: "#D4A5DB",
  secondary_color: "#EFE2F2",
  logo_url: null,
  brand_name: null as string | null,
};

export function usePOSContext(slug: string | undefined): UsePOSContextReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: qk.pos.context(slug),
    enabled: !!slug,
    retry: false,
    queryFn: async (): Promise<POSContext> => {
      const { data: site, error: siteErr } = await supabase
        .from("restaurant_websites")
        .select("user_id, slug")
        .eq("slug", slug!)
        .maybeSingle();
      if (siteErr) throw siteErr;
      if (!site) throw new Error("not_found");

      const [brandRes, profileRes] = await Promise.all([
        supabase.from("restaurant_brands")
          .select("brand_name, primary_color, accent_color, secondary_color, logo_url")
          .eq("user_id", site.user_id).maybeSingle(),
        supabase.from("profiles").select("restaurant_name").eq("user_id", site.user_id).maybeSingle(),
      ]);

      const brand = brandRes.data
        ? {
            primary_color: brandRes.data.primary_color || DEFAULT_BRAND.primary_color,
            accent_color: brandRes.data.accent_color || DEFAULT_BRAND.accent_color,
            secondary_color: brandRes.data.secondary_color || DEFAULT_BRAND.secondary_color,
            logo_url: brandRes.data.logo_url,
            brand_name: brandRes.data.brand_name,
          }
        : DEFAULT_BRAND;

      return {
        slug: site.slug,
        restaurantUserId: site.user_id,
        restaurantName: brand.brand_name || profileRes.data?.restaurant_name || "Restaurante",
        brand,
      };
    },
  });

  const mappedError: "not_found" | "error" | null = !slug
    ? "not_found"
    : error
      ? ((error as Error).message === "not_found" ? "not_found" : "error")
      : null;

  return { context: data ?? null, loading: isLoading, error: mappedError };
}
