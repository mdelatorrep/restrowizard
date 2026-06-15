import React from 'react';
import { useLocation } from 'react-router-dom';
import { RequireModuleAccess } from './RequireModuleAccess';
import { RESTAURANT_ROUTE_PERMISSIONS } from '@/config/routePermissions';

interface GuardedRouteProps {
  /** Override path-based lookup. If omitted, derives from current location after /r/. */
  pathKey?: string;
  children: React.ReactNode;
}

/**
 * Wraps a child route element and applies RequireModuleAccess
 * automatically using the central routePermissions registry.
 * If no entry is found for the path, renders children without gating
 * (used for purely informational pages without RBAC contract).
 */
export const GuardedRoute: React.FC<GuardedRouteProps> = ({ pathKey, children }) => {
  const location = useLocation();
  const key = pathKey ?? location.pathname.replace(/^\/r\/?/, '').replace(/\/$/, '');
  const entry = RESTAURANT_ROUTE_PERMISSIONS.find(r => r.path === key);
  if (!entry) return <>{children}</>;
  return (
    <RequireModuleAccess module={entry.module} level={entry.level ?? 'read'} fallback="message">
      {children}
    </RequireModuleAccess>
  );
};

export default GuardedRoute;
