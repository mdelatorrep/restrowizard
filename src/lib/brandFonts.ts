/**
 * Curated catalog of Google Fonts available for the brand identity.
 * Used by the Brand module typography selector and loaded on demand
 * in the admin (BrandThemeProvider) and public portal.
 */
export interface BrandFontOption {
  value: string;        // Google Fonts family name
  label: string;        // Display label (es)
  category: 'sans' | 'serif' | 'display' | 'mono' | 'handwriting';
  weights?: number[];   // weights to load
}

export const BRAND_FONT_OPTIONS: BrandFontOption[] = [
  // Sans-serif
  { value: 'Inter', label: 'Inter (Moderna, neutra)', category: 'sans' },
  { value: 'Lato', label: 'Lato (Cálida, amable)', category: 'sans' },
  { value: 'Montserrat', label: 'Montserrat (Geométrica, fuerte)', category: 'sans' },
  { value: 'Poppins', label: 'Poppins (Friendly, redondeada)', category: 'sans' },
  { value: 'Open Sans', label: 'Open Sans (Legible, clásica)', category: 'sans' },
  { value: 'Roboto', label: 'Roboto (Limpia, técnica)', category: 'sans' },
  { value: 'Nunito', label: 'Nunito (Suave, accesible)', category: 'sans' },
  { value: 'Work Sans', label: 'Work Sans (Profesional)', category: 'sans' },
  { value: 'DM Sans', label: 'DM Sans (Editorial moderna)', category: 'sans' },
  { value: 'Manrope', label: 'Manrope (Tecnológica)', category: 'sans' },

  // Serif (gastronomía premium)
  { value: 'Playfair Display', label: 'Playfair Display (Elegante, gourmet)', category: 'serif' },
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond (Refinada)', category: 'serif' },
  { value: 'Lora', label: 'Lora (Editorial, cálida)', category: 'serif' },
  { value: 'Merriweather', label: 'Merriweather (Legible, clásica)', category: 'serif' },
  { value: 'EB Garamond', label: 'EB Garamond (Tradicional)', category: 'serif' },
  { value: 'PT Serif', label: 'PT Serif (Neutra)', category: 'serif' },

  // Display / firma
  { value: 'Bebas Neue', label: 'Bebas Neue (Condensada, impactante)', category: 'display' },
  { value: 'Oswald', label: 'Oswald (Condensada, fuerte)', category: 'display' },
  { value: 'Abril Fatface', label: 'Abril Fatface (Magazine)', category: 'display' },

  // Handwriting (firmas / acentos)
  { value: 'Pacifico', label: 'Pacifico (Casual, friendly)', category: 'handwriting' },
  { value: 'Dancing Script', label: 'Dancing Script (Manuscrita)', category: 'handwriting' },
];

export const DEFAULT_PRIMARY_FONT = 'Playfair Display';
export const DEFAULT_SECONDARY_FONT = 'Lato';

/**
 * Lazily inject a <link> tag for one or more Google Fonts.
 * Safe to call multiple times — uses a stable id per family.
 */
export function loadGoogleFonts(families: (string | null | undefined)[]) {
  if (typeof document === 'undefined') return;
  const unique = Array.from(
    new Set(families.filter((f): f is string => !!f && f.trim().length > 1))
  );
  unique.forEach((family) => {
    const id = `gf-${family.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;500;600;700&display=swap`;
    document.head.appendChild(link);
  });
}
