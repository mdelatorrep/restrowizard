import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  Shield,
  LayoutDashboard,
  Users,
  Store,
  Briefcase,
  GraduationCap,
  Wrench,
  Rocket,
  Settings,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RouteErrorBoundary } from '@/components/errors/RouteErrorBoundary';

const adminNavItems = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { title: 'Usuarios', icon: Users, path: '/admin/users' },
  { title: 'Restaurantes', icon: Store, path: '/admin/restaurants' },
  { title: 'RestroJobs', icon: Briefcase, path: '/admin/jobs' },
  { title: 'RestroLearn', icon: GraduationCap, path: '/admin/learn' },
  { title: 'RestroServices', icon: Wrench, path: '/admin/services' },
  { title: 'RestroGrowth', icon: Rocket, path: '/admin/growth' },
  { title: 'Configuración', icon: Settings, path: '/admin/settings' },
];

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-destructive flex items-center justify-center">
              <Shield className="h-4 w-4 text-destructive-foreground" />
            </div>
            <div>
              <h1 className="font-headline font-bold text-sm text-sidebar-foreground">Super Admin</h1>
              <p className="text-xs text-sidebar-foreground/60">Plataforma RestroWizard</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {adminNavItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive(item.path)
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </button>
          ))}
        </nav>

        <div className="p-2 border-t border-sidebar-border space-y-1">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver al sitio
          </button>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto">
        <RouteErrorBoundary key={location.pathname} label={location.pathname}>
          <Outlet />
        </RouteErrorBoundary>
      </main>
    </div>
  );
};

export default AdminLayout;
