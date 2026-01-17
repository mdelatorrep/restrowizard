import React, { useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurantLifecycle, getStageInfo, RestaurantStage } from '@/hooks/useRestaurantLifecycle';
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
  Store,
  Building2,
  CalendarDays,
  Palette,
  MessageSquare,
  BookOpen,
  ShoppingBag,
  Target,
  HeadphonesIcon,
  Globe,
  Rocket,
  Crown,
  Lightbulb,
  Wrench,
  Timer,
  TrendingUp,
  LucideIcon,
} from 'lucide-react';
import { ClientSelector } from '@/components/consultant/ClientSelector';

interface AppSidebarProps {
  userType: 'restaurant_owner' | 'consultant';
}

interface MenuItem {
  title: string;
  icon: LucideIcon;
  path: string;
  stages?: RestaurantStage[];
}

// Módulos según etapa del ciclo de vida
const lifecycleMenuItems: MenuItem[] = [
  // Dashboard siempre visible
  { title: 'Dashboard', icon: LayoutDashboard, path: '/r/dashboard' },
  
  // Concepción y Habilitación - Nuevo Negocio
  { 
    title: 'Nuevo Negocio', 
    icon: Lightbulb, 
    path: '/r/new-business',
    stages: ['conception', 'enablement', 'no_project']
  },
  
  // Pre-Apertura
  { 
    title: 'Pre-Apertura', 
    icon: Timer, 
    path: '/r/pre-opening',
    stages: ['pre_opening']
  },
  
  // Primeros 90 Días
  { 
    title: 'Primeros 90 Días', 
    icon: TrendingUp, 
    path: '/r/first-90-days',
    stages: ['first_90_days']
  },
  
  // Módulos de operación (disponibles desde pre-apertura en adelante)
  { 
    title: 'Finanzas IA', 
    icon: DollarSign, 
    path: '/r/finances',
    stages: ['pre_opening', 'first_90_days', 'normal_operation']
  },
  { 
    title: 'Operaciones IA', 
    icon: ChefHat, 
    path: '/r/operations',
    stages: ['pre_opening', 'first_90_days', 'normal_operation']
  },
  { 
    title: 'Talento IA', 
    icon: Users, 
    path: '/r/talent',
    stages: ['enablement', 'pre_opening', 'first_90_days', 'normal_operation']
  },
  { 
    title: 'Ingeniería de Menú', 
    icon: Utensils, 
    path: '/r/menu-engineering',
    stages: ['enablement', 'pre_opening', 'first_90_days', 'normal_operation']
  },
  { 
    title: 'Sostenibilidad', 
    icon: Leaf, 
    path: '/r/sustainability',
    stages: ['first_90_days', 'normal_operation']
  },
  { 
    title: 'Ghost Kitchen', 
    icon: Store, 
    path: '/r/ghost-kitchen',
    stages: ['normal_operation']
  },
  { 
    title: 'Gestión de Cadenas', 
    icon: Building2, 
    path: '/r/chain-management',
    stages: ['normal_operation']
  },
];

const lifecycleExtraItems: MenuItem[] = [
  { 
    title: 'Marca', 
    icon: Palette, 
    path: '/r/brand',
    stages: ['conception', 'enablement', 'pre_opening', 'first_90_days', 'normal_operation']
  },
  { 
    title: 'Menús Digitales', 
    icon: Utensils, 
    path: '/r/menus',
    stages: ['enablement', 'pre_opening', 'first_90_days', 'normal_operation']
  },
  { 
    title: 'Fidelización', 
    icon: Crown, 
    path: '/r/loyalty',
    stages: ['first_90_days', 'normal_operation']
  },
  { 
    title: 'Feedback', 
    icon: MessageSquare, 
    path: '/r/feedback',
    stages: ['first_90_days', 'normal_operation']
  },
  { 
    title: 'Recetas', 
    icon: BookOpen, 
    path: '/r/recipes',
    stages: ['enablement', 'pre_opening', 'first_90_days', 'normal_operation']
  },
  { 
    title: 'Pedidos', 
    icon: ShoppingBag, 
    path: '/r/orders',
    stages: ['first_90_days', 'normal_operation']
  },
  { 
    title: 'Metas de Venta', 
    icon: Target, 
    path: '/r/sales-goals',
    stages: ['pre_opening', 'first_90_days', 'normal_operation']
  },
  { 
    title: 'Soporte PQRS', 
    icon: HeadphonesIcon, 
    path: '/r/support',
    stages: ['first_90_days', 'normal_operation']
  },
  { 
    title: 'Social Listening', 
    icon: Globe, 
    path: '/r/social-listening',
    stages: ['first_90_days', 'normal_operation']
  },
];

// Consultant AI tools - same as restaurant but for clients
const consultantAIToolsItems = [
  { title: 'Finanzas IA', icon: DollarSign, path: '/c/finances' },
  { title: 'Operaciones IA', icon: ChefHat, path: '/c/operations' },
  { title: 'Talento IA', icon: Users, path: '/c/talent' },
  { title: 'Ingeniería de Menú', icon: Utensils, path: '/c/menu-engineering' },
  { title: 'Sostenibilidad', icon: Leaf, path: '/c/sustainability' },
  { title: 'Ghost Kitchen', icon: Store, path: '/c/ghost-kitchen' },
  { title: 'Gestión de Cadenas', icon: Building2, path: '/c/chain-management' },
  { title: 'Eventos y Cotizaciones', icon: CalendarDays, path: '/c/events' },
];

// Consultant management menu
const consultantManagementItems = [
  { title: 'Vista General', icon: LayoutDashboard, path: '/c/dashboard' },
  { title: 'Facturación', icon: CreditCard, path: '/c/billing' },
];

// Stage color mapping
const getStageColor = (stage: RestaurantStage): string => {
  const colors: Record<RestaurantStage, string> = {
    conception: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    enablement: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    pre_opening: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    first_90_days: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    normal_operation: 'bg-muted text-muted-foreground border-muted',
    no_project: 'bg-muted text-muted-foreground border-muted',
  };
  return colors[stage];
};

export const AppSidebar: React.FC<AppSidebarProps> = ({ userType }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { state, toggleSidebar } = useSidebar();
  const lifecycle = useRestaurantLifecycle();

  const isCollapsed = state === 'collapsed';
  const settingsPath = userType === 'restaurant_owner' ? '/r/settings' : '/c/settings';

  const isActive = (path: string) => location.pathname === path;

  // Filter menu items based on current lifecycle stage
  const filteredMenuItems = useMemo(() => {
    if (userType !== 'restaurant_owner') return [];
    
    return lifecycleMenuItems.filter(item => {
      // Items without stages restriction are always visible
      if (!item.stages) return true;
      // Show if current stage is in the allowed stages
      return item.stages.includes(lifecycle.stage);
    });
  }, [lifecycle.stage, userType]);

  const filteredExtraItems = useMemo(() => {
    if (userType !== 'restaurant_owner') return [];
    
    return lifecycleExtraItems.filter(item => {
      if (!item.stages) return true;
      return item.stages.includes(lifecycle.stage);
    });
  }, [lifecycle.stage, userType]);

  const stageInfo = getStageInfo(lifecycle.stage);

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
        {/* Restaurant Owner: Show lifecycle stage indicator */}
        {userType === 'restaurant_owner' && !isCollapsed && !lifecycle.isLoading && (
          <div className="px-3 pt-3">
            <div className={`rounded-lg border px-3 py-2 ${getStageColor(lifecycle.stage)}`}>
              <div className="flex items-center gap-2">
                <div className="text-xs font-medium uppercase tracking-wider opacity-70">
                  Etapa actual
                </div>
              </div>
              <div className="font-semibold text-sm mt-1">
                {stageInfo.title}
              </div>
              {lifecycle.daysUntilOpening !== undefined && lifecycle.daysUntilOpening > 0 && (
                <div className="text-xs opacity-70 mt-0.5">
                  {lifecycle.daysUntilOpening} días para apertura
                </div>
              )}
              {lifecycle.daysRemainingIn90 !== undefined && (
                <div className="text-xs opacity-70 mt-0.5">
                  Día {lifecycle.daysSinceOpening} de 90
                </div>
              )}
            </div>
          </div>
        )}

        {/* Consultant-specific: Client Selector with lifecycle info */}
        {userType === 'consultant' && !isCollapsed && (
          <div className="px-3 pt-3">
            <ClientSelector compact />
          </div>
        )}

        {/* For Restaurant Owners */}
        {userType === 'restaurant_owner' && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel className="text-sidebar-foreground/70 font-lato-medium">
                Gestión IA
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredMenuItems.map((item) => (
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

            {filteredExtraItems.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-sidebar-foreground/70 font-lato-medium">
                  Módulos Extra
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {filteredExtraItems.map((item) => (
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
          </>
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
