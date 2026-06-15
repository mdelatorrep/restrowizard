import type { ModuleKey, ModulePermission } from '@/hooks/useTeamMembers';

/**
 * Single source of truth: route → required module + level.
 * Every protected route under /r/* MUST be listed here.
 * Used both for runtime <RequireModuleAccess> guarding and for the sidebar
 * to derive its permissionModule from the path automatically.
 */
export interface RoutePermission {
  path: string; // path relative to /r (e.g. "dashboard", "integrations/rappi")
  module: ModuleKey;
  level?: ModulePermission; // default 'read'
}

export const RESTAURANT_ROUTE_PERMISSIONS: RoutePermission[] = [
  { path: 'dashboard', module: 'dashboard' },
  { path: 'finances', module: 'finances' },
  { path: 'talent', module: 'talent' },
  { path: 'sustainability', module: 'sustainability' },
  { path: 'ghost-kitchen', module: 'ghost_kitchen' },
  { path: 'chain-management', module: 'chain_management' },
  { path: 'brand', module: 'brand' },
  { path: 'feedback', module: 'feedback' },
  { path: 'recipes', module: 'recipes' },
  { path: 'orders', module: 'orders' },
  { path: 'support', module: 'support' },
  { path: 'new-business', module: 'new_business' },
  { path: 'menus', module: 'menus' },
  { path: 'loyalty', module: 'loyalty' },
  { path: 'first-90-days', module: 'first_90_days' },
  { path: 'pre-opening', module: 'pre_opening' },
  { path: 'pos', module: 'pos', level: 'write' },
  { path: 'pos-reports', module: 'pos_reports' },
  { path: 'pos-audit', module: 'pos_audit' },
  { path: 'kitchen', module: 'kitchen_display' },
  { path: 'website', module: 'website' },
  { path: 'reservations', module: 'reservations' },
  { path: 'inventory', module: 'inventory' },
  { path: 'delivery', module: 'delivery' },
  { path: 'integrations/rappi', module: 'rappi' },
  { path: 'settings', module: 'settings' },
  { path: 'ecosystem-admin', module: 'ecosystem_admin' },
  { path: 'my-development', module: 'my_development' },
  { path: 'knowledge', module: 'knowledge' },
  { path: 'invoices', module: 'invoices' },
  { path: 'electronic-invoicing', module: 'electronic_invoicing' }
];

export const getRoutePermission = (path: string): RoutePermission | undefined =>
  RESTAURANT_ROUTE_PERMISSIONS.find(r => r.path === path);
