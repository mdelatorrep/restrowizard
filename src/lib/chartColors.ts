/**
 * Resolved color palette for Chart.js (canvas does not parse CSS variables).
 * Uses brand tokens: primary purple #3E1064, accent #D4A5DB.
 */
export const CHART_COLORS = {
  primary: '#3E1064',
  primaryAlpha: 'rgba(62, 16, 100, 0.15)',
  accent: '#D4A5DB',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  muted: '#94a3b8',
} as const;

export const CHART_PALETTE = [
  '#3E1064', // primary purple
  '#D4A5DB', // accent
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#3b82f6', // blue
  '#a855f7', // violet
  '#14b8a6', // teal
  '#ec4899', // pink
  '#f97316', // orange
];

export const pickPalette = (count: number): string[] =>
  Array.from({ length: count }, (_, i) => CHART_PALETTE[i % CHART_PALETTE.length]);
