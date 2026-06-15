/**
 * Color conversion utilities for the dynamic brand theme.
 * Tailwind tokens in this project use the `H S% L%` (space-separated) format
 * so they can be consumed via `hsl(var(--token))`.
 */

export function hexToHslString(hex: string): string | null {
  if (!hex) return null;
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;

  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let s = 0;
  let hue = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hue = (g - b) / d + (g < b ? 6 : 0); break;
      case g: hue = (b - r) / d + 2; break;
      case b: hue = (r - g) / d + 4; break;
    }
    hue *= 60;
  }

  return `${Math.round(hue)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Return a foreground HSL string (white/dark) that contrasts with the given hex. */
export function readableForegroundHsl(hex: string): string {
  const h = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return '0 0% 100%';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // Perceived luminance (sRGB)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? '0 0% 10%' : '0 0% 100%';
}

/** Lighten or darken an HSL string by a percentage delta on L. */
export function shiftHslLightness(hslStr: string, deltaL: number): string {
  const m = hslStr.match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  if (!m) return hslStr;
  const h = Number(m[1]);
  const s = Number(m[2]);
  const l = Math.max(0, Math.min(100, Number(m[3]) + deltaL));
  return `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`;
}
