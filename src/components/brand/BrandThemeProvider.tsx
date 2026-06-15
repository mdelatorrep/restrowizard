import { ReactNode, useEffect } from 'react';
import { useBrandData } from '@/hooks/useBrandData';
import { useUserType } from '@/hooks/useUserType';
import { hexToHslString, readableForegroundHsl, shiftHslLightness } from '@/lib/colorUtils';

/**
 * Injects the active restaurant brand into the running admin UI:
 *  - Overrides design-token CSS variables (primary / secondary / accent / ring / sidebar)
 *  - Sets the document favicon and title
 *  - Loads brand fonts via Google Fonts
 *
 * Tokens fall back to the default RestroWizard palette declared in index.css
 * whenever a brand value is missing or invalid, so the UI never breaks.
 */
export function BrandThemeProvider({ children }: { children: ReactNode }) {
  const { userType } = useUserType();
  const { brand } = useBrandData();

  // Apply colors + sidebar theme
  useEffect(() => {
    if (userType !== 'restaurant_owner') return;
    const root = document.documentElement;

    // Track which props we set so we can clean up on unmount / brand change.
    const applied: string[] = [];
    const set = (prop: string, value: string | null) => {
      if (!value) return;
      root.style.setProperty(prop, value);
      applied.push(prop);
    };

    const primary = brand?.primary_color ? hexToHslString(brand.primary_color) : null;
    const secondary = brand?.secondary_color ? hexToHslString(brand.secondary_color) : null;
    const accent = brand?.accent_color ? hexToHslString(brand.accent_color) : null;

    if (primary) {
      set('--primary', primary);
      set('--primary-foreground', readableForegroundHsl(brand!.primary_color));
      set('--ring', primary);
      set('--sidebar-background', primary);
      set('--sidebar-foreground', readableForegroundHsl(brand!.primary_color));
      set('--sidebar-accent', shiftHslLightness(primary, 8));
      set('--sidebar-accent-foreground', readableForegroundHsl(brand!.primary_color));
      set('--sidebar-border', shiftHslLightness(primary, 12));
      set('--sidebar-ring', accent || primary);
    }
    if (secondary) {
      set('--secondary', secondary);
      set('--secondary-foreground', readableForegroundHsl(brand!.secondary_color));
      set('--sidebar-primary', secondary);
      set('--sidebar-primary-foreground', readableForegroundHsl(brand!.secondary_color));
    }
    if (accent) {
      set('--accent', accent);
      set('--accent-foreground', readableForegroundHsl(brand!.accent_color));
    }

    return () => {
      applied.forEach((p) => root.style.removeProperty(p));
    };
  }, [
    userType,
    brand?.primary_color,
    brand?.secondary_color,
    brand?.accent_color,
  ]);

  // Apply favicon + document title
  useEffect(() => {
    if (userType !== 'restaurant_owner' || !brand) return;
    const favUrl = brand.favicon_url || brand.logo_square_url || brand.logo_url;
    if (favUrl) {
      let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = favUrl;
    }
    if (brand.brand_name) {
      document.title = brand.brand_name;
    }
  }, [userType, brand?.favicon_url, brand?.logo_square_url, brand?.logo_url, brand?.brand_name]);

  // Load brand fonts dynamically (Google Fonts)
  useEffect(() => {
    if (userType !== 'restaurant_owner') return;
    const fonts = [brand?.font_primary, brand?.font_secondary].filter(
      (f): f is string => !!f && f.length > 1
    );
    if (fonts.length === 0) return;
    const family = fonts
      .map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`)
      .join('&');
    const href = `https://fonts.googleapis.com/css2?${family}&display=swap`;
    const id = 'brand-fonts-link';
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = href;
  }, [userType, brand?.font_primary, brand?.font_secondary]);

  return <>{children}</>;
}
