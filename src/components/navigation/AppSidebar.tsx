import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  DollarSign,
  Settings as SettingsIcon,
  Users,
  Utensils,
  Leaf,
  ChefHat,
  CreditCard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Briefcase,
} from 'lucide-react';
import { ClientSelector } from '@/components/consultant/ClientSelector';

interface AppSidebarProps {
  userType: 'restaurant_owner' | 'consultant';
}

const restaurantMenuItems = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/r/dashboard' },
  { title: 'Finanzas IA', icon: DollarSign, path: '/r/finances' },
  { title: 'Operaciones IA', icon: ChefHat, path: '/r/operations' },
  { title: 'Talento IA', icon: Users, path: '/r/talent' },
  { title: 'Ingeniería de Menú', icon: Utensils, path: '/r/menu-engineering' },
  { title: 'Sostenibilidad', icon: Leaf, path: '/r/sustainability' },
];

// Consultant AI tools - same as restaurant but for clients
const consultantAIToolsItems = [
  { title: 'Finanzas IA', icon: DollarSign, path: '/c/finances' },
  { title: 'Operaciones IA', icon: ChefHat, path: '/c/operations' },
  { title: 'Talento IA', icon: Users, path: '/c/talent' },
  { title: 'Ingeniería de Menú', icon: Utensils, path: '/c/menu-engineering' },
  { title: 'Sostenibilidad', icon: Leaf, path: '/c/sustainability' },
];

// Consultant management menu
const consultantManagementItems = [
  { title: 'Vista General', icon: LayoutDashboard, path: '/c/dashboard' },
  { title: 'Facturación', icon: CreditCard, path: '/c/billing' },
];

export const AppSidebar: React.FC<AppSidebarProps> = ({ userType }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { state, toggleSidebar } = useSidebar();

  const isCollapsed = state === 'collapsed';
  const settingsPath = userType === 'restaurant_owner' ? '/r/settings' : '/c/settings';

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <Sidebar
      className={userType === 'consultant' ? 'consultant-sidebar' : ''}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <span className="text-sidebar-primary-foreground font-bold text-sm">RW</span>
              </div>
              <span className="font-headline font-bold text-sidebar-foreground">
                RestroWizard
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Consultant-specific: Client Selector */}
        {userType === 'consultant' && !isCollapsed && (
          <div className="px-3 pt-3">
            <ClientSelector compact />
          </div>
        )}

        {/* For Restaurant Owners */}
        {userType === 'restaurant_owner' && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/70 font-lato-medium">
              Gestión
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {restaurantMenuItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.path)}
                      isActive={isActive(item.path)}
                      tooltip={item.title}
                      className="text-sidebar-foreground hover:bg-sidebar-accent"
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-lato-medium">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* For Consultants: AI Tools Section */}
        {userType === 'consultant' && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel className="text-sidebar-foreground/70 font-lato-medium">
                Herramientas IA
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {consultantAIToolsItems.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        onClick={() => navigate(item.path)}
                        isActive={isActive(item.path)}
                        tooltip={item.title}
                        className="text-sidebar-foreground hover:bg-sidebar-accent"
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="font-lato-medium">{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-sidebar-foreground/70 font-lato-medium">
                <Briefcase className="h-4 w-4 inline mr-1" />
                Mi Consultoría
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {consultantManagementItems.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        onClick={() => navigate(item.path)}
                        isActive={isActive(item.path)}
                        tooltip={item.title}
                        className="text-sidebar-foreground hover:bg-sidebar-accent"
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="font-lato-medium">{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 font-lato-medium">
            Configuración
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate(settingsPath)}
                  isActive={isActive(settingsPath)}
                  tooltip="Configuración"
                  className="text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  <SettingsIcon className="h-5 w-5" />
                  <span className="font-lato-medium">Configuración</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Cerrar Sesión"
              className="text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-lato-medium">Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
