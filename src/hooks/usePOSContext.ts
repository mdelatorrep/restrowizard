import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  const [context, setContext] = useState<POSContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"not_found" | "error" | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!slug) {
        setLoading(false);
        setError("not_found");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { data: site, error: siteErr } = await supabase
          .from("restaurant_websites")
          .select("user_id, slug")
          .eq("slug", slug)
          .maybeSingle();
        if (siteErr) throw siteErr;
        if (!site) {
          if (!cancelled) {
            setError("not_found");
            setLoading(false);
          }
          return;
        }

        const [brandRes, profileRes] = await Promise.all([
          supabase
            .from("restaurant_brands")
            .select("brand_name, primary_color, accent_color, secondary_color, logo_url")
            .eq("user_id", site.user_id)
            .maybeSingle(),
          supabase
            .from("profiles")
            .select("restaurant_name")
            .eq("user_id", site.user_id)
            .maybeSingle(),
        ]);

        if (cancelled) return;

        const brand = brandRes.data
          ? {
              primary_color: brandRes.data.primary_color || DEFAULT_BRAND.primary_color,
              accent_color: brandRes.data.accent_color || DEFAULT_BRAND.accent_color,
              secondary_color: brandRes.data.secondary_color || DEFAULT_BRAND.secondary_color,
              logo_url: brandRes.data.logo_url,
              brand_name: brandRes.data.brand_name,
            }
          : DEFAULT_BRAND;

        setContext({
          slug: site.slug,
          restaurantUserId: site.user_id,
          restaurantName:
            brand.brand_name || profileRes.data?.restaurant_name || "Restaurante",
          brand,
        });
        setLoading(false);
      } catch (e) {
        console.error("usePOSContext error", e);
        if (!cancelled) {
          setError("error");
          setLoading(false);
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { context, loading, error };
}
