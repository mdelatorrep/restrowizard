---
name: Admin Brand Theme Sync
description: BrandThemeProvider injects restaurant brand (colors, logo, fonts, favicon) into the admin UI so owners feel the system is theirs
type: feature
---

`src/components/brand/BrandThemeProvider.tsx` wraps `AppLayout` and, for `restaurant_owner` users, overrides design-token CSS variables at runtime using `useBrandData`:
- `--primary` / `--primary-foreground` / `--ring` from `primary_color`
- `--secondary` / `--secondary-foreground` from `secondary_color`
- `--accent` / `--accent-foreground` from `accent_color`
- Sidebar tokens (`--sidebar-background`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-accent`, `--sidebar-border`, `--sidebar-ring`) are derived from primary/secondary so the sidebar reflects the brand too.
- Loads `font_primary` + `font_secondary` from Google Fonts.
- Sets favicon (`favicon_url` → `logo_square_url` → `logo_url`) and `document.title` to `brand_name`.

Hex → HSL helpers live in `src/lib/colorUtils.ts` (`hexToHslString`, `readableForegroundHsl`, `shiftHslLightness`). Tailwind tokens use the space-separated `H S% L%` format.

`AppSidebar` header and `AppHeader` render the brand logo + name when available, falling back to "RestroWizard" / "RW" initials. Consultants keep the default theme (their own branding lives elsewhere).
