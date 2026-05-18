import React, { useMemo, useState } from 'react';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurantLifecycle, getStageInfo, RestaurantStage } from '@/hooks/useRestaurantLifecycle';
import { useModulePrerequisites } from '@/hooks/useModulePrerequisites';
import { useTeamPermissions } from '@/hooks/useTeamPermissions';
import type { ModulePermissions } from '@/hooks/useTeamMembers';
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
  HeadphonesIcon,
  Globe,
  Rocket,
  Crown,
  Lightbulb,
  Wrench,
  Timer,
  CalendarCheck,
  TrendingUp,
  LucideIcon,
  UtensilsCrossed,
  BarChart3,
  Truck,
  Package,
  ScanLine,
  AlertCircle,
  Lock,
  ChevronDown,
  Shield,
  GraduationCap,
} from 'lucide-react';
import { ClientSelector } from '@/components/consultant/ClientSelector';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';

interface AppSidebarProps {
  userType: 'restaurant_owner' | 'consultant';
}

interface MenuItem {
  title: string;
  icon: LucideIcon;
  path: string;
  stages?: RestaurantStage[];
  moduleKey?: string; // Key to check prerequisites
  permissionModule?: keyof ModulePermissions; // Key to check team permissions
}

// ====== SIDEBAR REORGANIZADO POR GRUPOS LÓGICOS ======

// 1. PRINCIPAL - Contextual por etapa
const mainNavigationItems: MenuItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/r/dashboard' },
  { 
    title: 'Nuevo Negocio', 
    icon: Lightbulb, 
    path: '/r/new-business',
    stages: ['conception', 'enablement', 'no_project']
  },
  { 
    title: 'Pre-Apertura', 
    icon: Timer, 
    path: '/r/pre-opening',
    stages: ['pre_opening']
  },
  { 
    title: 'Primeros 90 Días', 
    icon: TrendingUp, 
    path: '/r/first-90-days',
    stages: ['first_90_days']
  },
];

// 2. MI RESTAURANTE - Configuración del negocio
const myRestaurantItems: MenuItem[] = [
  { 
    title: 'Marca e Identidad', 
    icon: Palette, 
    path: '/r/brand',
    stages: ['conception', 'enablement', 'pre_opening', 'first_90_days', 'normal_operation'],
    moduleKey: 'brand',
    permissionModule: 'brand'
  },
  { 
    title: 'Recetas y Costos', 
    icon: BookOpen, 
    path: '/r/recipes',
    stages: ['enablement', 'pre_opening', 'first_90_days', 'normal_operation'],
    moduleKey: 'recipes',
    permissionModule: 'recipes'
  },
  { 
    title: 'Menús Digitales', 
    icon: Utensils, 
    path: '/r/menus',
    stages: ['enablement', 'pre_opening', 'first_90_days', 'normal_operation'],
    moduleKey: 'menus',
    permissionModule: 'menus'
  },
  { 
    title: 'Inventario y Proveedores', 
    icon: Package, 
    path: '/r/inventory',
    stages: ['enablement', 'pre_opening', 'first_90_days', 'normal_operation'],
    moduleKey: 'inventory',
    permissionModule: 'inventory'
  },
];

// 3. VENTAS - Operaciones diarias
const salesItems: MenuItem[] = [
  { 
    title: 'Punto de Venta', 
    icon: CreditCard, 
    path: '/r/pos',
    stages: ['first_90_days', 'normal_operation'],
    moduleKey: 'pos',
    permissionModule: 'pos'
  },
  { 
    title: 'Pedidos y Cocina', 
    icon: UtensilsCrossed, 
    path: '/r/orders',
    stages: ['first_90_days', 'normal_operation'],
    moduleKey: 'orders',
    permissionModule: 'orders'
  },
  { 
    title: 'Domicilios', 
    icon: Truck, 
    path: '/r/delivery',
    stages: ['first_90_days', 'normal_operation'],
    moduleKey: 'delivery',
    permissionModule: 'delivery'
  },
  { 
    title: 'Rappi', 
    icon: Truck, 
    path: '/r/integrations/rappi',
    stages: ['first_90_days', 'normal_operation'],
    moduleKey: 'delivery',
    permissionModule: 'delivery'
  },
  { 
    title: 'Reservaciones', 
    icon: CalendarCheck, 
    path: '/r/reservations',
    stages: ['pre_opening', 'first_90_days', 'normal_operation'],
    moduleKey: 'reservations',
    permissionModule: 'reservations'
  },
  { 
    title: 'Reportes y Metas', 
    icon: BarChart3, 
    path: '/r/pos-reports',
    stages: ['first_90_days', 'normal_operation'],
    moduleKey: 'pos-reports',
    permissionModule: 'finances'
  },
];

// 4. EQUIPO Y CLIENTES - Personas
const peopleItems: MenuItem[] = [
  { 
    title: 'Talento y Turnos', 
    icon: Users, 
    path: '/r/talent',
    stages: ['enablement', 'pre_opening', 'first_90_days', 'normal_operation'],
    moduleKey: 'talent',
    permissionModule: 'talent'
  },
  { 
    title: 'Mi Desarrollo', 
    icon: GraduationCap, 
    path: '/r/my-development',
    stages: ['enablement', 'pre_opening', 'first_90_days', 'normal_operation'],
  },
  { 
    title: 'Fidelización', 
    icon: Crown, 
    path: '/r/loyalty',
    stages: ['first_90_days', 'normal_operation'],
    moduleKey: 'loyalty',
    permissionModule: 'loyalty'
  },
  { 
    title: 'Feedback y Reputación', 
    icon: MessageSquare, 
    path: '/r/feedback',
    stages: ['first_90_days', 'normal_operation'],
    moduleKey: 'feedback',
    permissionModule: 'feedback'
  },
  { 
    title: 'Soporte PQRS', 
    icon: HeadphonesIcon, 
    path: '/r/support',
    stages: ['first_90_days', 'normal_operation'],
    moduleKey: 'support'
  },
  {
    title: 'Base de Conocimiento',
    icon: BookOpen,
    path: '/r/knowledge',
    stages: ['enablement', 'pre_opening', 'first_90_days', 'normal_operation'],
    moduleKey: 'knowledge'
  },
  {
    title: 'Facturas con IA',
    icon: ScanLine,
    path: '/r/invoices',
    stages: ['first_90_days', 'normal_operation'],
    moduleKey: 'invoices'
  },
];

// 5. PRESENCIA DIGITAL
const digitalPresenceItems: MenuItem[] = [
  { 
    title: 'Sitio Web y URLs', 
    icon: Globe, 
    path: '/r/website',
    stages: ['enablement', 'pre_opening', 'first_90_days', 'normal_operation'],
    moduleKey: 'website',
    permissionModule: 'website'
  },
];

// 6. FINANZAS Y ANÁLISIS - Solo para operación normal
const financeItems: MenuItem[] = [
  { 
    title: 'Finanzas IA', 
    icon: DollarSign, 
    path: '/r/finances',
    stages: ['first_90_days', 'normal_operation'],
    moduleKey: 'finances',
    permissionModule: 'finances'
  },
  { 
    title: 'Sostenibilidad', 
    icon: Leaf, 
    path: '/r/sustainability',
    stages: ['first_90_days', 'normal_operation'],
    moduleKey: 'sustainability'
  },
];

// 7. EXPANSIÓN - Oculto por defecto, solo operación normal
const expansionItems: MenuItem[] = [
  { 
    title: 'Ghost Kitchen', 
    icon: Store, 
    path: '/r/ghost-kitchen',
    stages: ['normal_operation'],
    moduleKey: 'ghost-kitchen'
  },
  { 
    title: 'Gestión de Cadenas', 
    icon: Building2, 
    path: '/r/chain-management',
    stages: ['normal_operation'],
    moduleKey: 'chain-management'
  },
  { 
    title: 'Admin Ecosistema', 
    icon: Wrench, 
    path: '/r/ecosystem-admin',
    stages: ['enablement', 'pre_opening', 'first_90_days', 'normal_operation'],
  },
];

// Consultant AI tools
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

const consultantManagementItems = [
  { title: 'Vista General', icon: LayoutDashboard, path: '/c/dashboard' },
  { title: 'Facturación', icon: CreditCard, path: '/c/billing' },
];

// Stage color mapping
const getStageColor = (stage: RestaurantStage): string => {
  const colors: Record<RestaurantStage, string> = {
    conception: 'bg-sidebar-accent/60 text-sidebar-foreground/80 border-sidebar-border',
    enablement: 'bg-sidebar-accent/80 text-sidebar-foreground border-sidebar-border',
    pre_opening: 'bg-sidebar-primary/20 text-sidebar-foreground border-sidebar-primary/30',
    first_90_days: 'bg-sidebar-primary/30 text-sidebar-foreground border-sidebar-primary/40',
    normal_operation: 'bg-sidebar-accent text-sidebar-foreground/70 border-sidebar-border',
    no_project: 'bg-sidebar-accent text-sidebar-foreground/60 border-sidebar-border',
  };
  return colors[stage];
};

export const AppSidebar: React.FC<AppSidebarProps> = ({ userType }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { state, toggleSidebar } = useSidebar();
  const lifecycle = useRestaurantLifecycle();
  const prerequisites = useModulePrerequisites();
  const teamPermissions = useTeamPermissions();
  const [expansionOpen, setExpansionOpen] = useState(false);
  const [showAllModules, setShowAllModules] = useState(false);

  const isCollapsed = state === 'collapsed';
  const settingsPath = userType === 'restaurant_owner' ? '/r/settings' : '/c/settings';

  const isActive = (path: string) => location.pathname === path;

  // Check if user has permission for a module
  const hasModulePermission = (item: MenuItem): boolean => {
    // If no permission module defined, allow access
    if (!item.permissionModule) return true;
    // Owners and loading state - allow access
    if (teamPermissions.isLoading || teamPermissions.isOwner) return true;
    // Check team permissions
    return teamPermissions.canAccess(item.permissionModule, 'read');
  };

  // Filter menu items based on lifecycle stage and permissions
  const filterByStageAndPermissions = (items: MenuItem[]) => {
    let filtered = items;
    
    // Filter by stage unless showing all
    if (!showAllModules) {
      filtered = filtered.filter(item => {
        if (!item.stages) return true;
        return item.stages.includes(lifecycle.stage);
      });
    }
    
    // Filter by team permissions (only for team members, not owners)
    if (!teamPermissions.isOwner && teamPermissions.isTeamMember) {
      filtered = filtered.filter(hasModulePermission);
    }
    
    return filtered;
  };

  // Get module status for an item
  const getModuleStatus = (item: MenuItem) => {
    if (!item.moduleKey || prerequisites.loading) return { enabled: true };
    return prerequisites.modules[item.moduleKey] || { enabled: true };
  };

  // Render menu item with prerequisite check
  const renderMenuItem = (item: MenuItem) => {
    const status = getModuleStatus(item);
    const isDisabled = !status.enabled;
    
    return (
      <SidebarMenuItem key={item.path}>
        {isDisabled ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarMenuButton
                isActive={isActive(item.path)}
                tooltip={item.title}
                className="text-sidebar-foreground/40 cursor-not-allowed hover:bg-transparent"
                onClick={(e) => e.preventDefault()}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-lato-medium">{item.title}</span>
                <Lock className="h-3 w-3 ml-auto" />
              </SidebarMenuButton>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-[200px]">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">{status.reason}</p>
                  {status.prerequisite && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="h-auto p-0 text-xs"
                      onClick={() => navigate(`/r/${status.prerequisite}`)}
                    >
                      Ir a configurar →
                    </Button>
                  )}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        ) : (
          <SidebarMenuButton
            onClick={() => navigate(item.path)}
            isActive={isActive(item.path)}
            tooltip={item.title}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <item.icon className="h-5 w-5" />
            <span className="font-lato-medium">{item.title}</span>
            {status.reason && !isCollapsed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertCircle className="h-3 w-3 ml-auto text-amber-400" />
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="text-xs">{status.reason}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </SidebarMenuButton>
        )}
      </SidebarMenuItem>
    );
  };

  // Filtered items for restaurant owner
  const filteredMainNav = filterByStageAndPermissions(mainNavigationItems);
  const filteredMyRestaurant = filterByStageAndPermissions(myRestaurantItems);
  const filteredSales = filterByStageAndPermissions(salesItems);
  const filteredPeople = filterByStageAndPermissions(peopleItems);
  const filteredDigital = filterByStageAndPermissions(digitalPresenceItems);
  const filteredFinance = filterByStageAndPermissions(financeItems);
  const filteredExpansion = filterByStageAndPermissions(expansionItems);

  const stageInfo = getStageInfo(lifecycle.stage);

  const handleLogout = () => {
    signOut();
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

        {/* Consultant: Client Selector */}
        {userType === 'consultant' && !isCollapsed && (
          <div className="px-3 pt-3">
            <ClientSelector compact />
          </div>
        )}

         {/* Toggle para ver todos los módulos */}
         {userType === 'restaurant_owner' && !isCollapsed && (
           <div className="px-3 pt-2">
             <div className="flex items-center justify-between text-xs">
               <span className="text-sidebar-foreground/70">Ver todos los módulos</span>
               <Switch 
                 checked={showAllModules} 
                 onCheckedChange={setShowAllModules}
                 className="scale-75"
               />
             </div>
           </div>
         )}
 
        {/* ====== RESTAURANT OWNER NAVIGATION ====== */}
        {userType === 'restaurant_owner' && (
          <>
            {/* Main Navigation */}
            <SidebarGroup>
              <SidebarGroupLabel className="text-sidebar-foreground/70 font-lato-medium">
                Principal
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredMainNav.map(renderMenuItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Mi Restaurante - Business Configuration */}
            {filteredMyRestaurant.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-sidebar-foreground/70 font-lato-medium">
                  Mi Restaurante
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {filteredMyRestaurant.map(renderMenuItem)}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* Ventas */}
            {filteredSales.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-sidebar-foreground/70 font-lato-medium">
                  Ventas
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {filteredSales.map(renderMenuItem)}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* Equipo y Clientes */}
            {filteredPeople.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-sidebar-foreground/70 font-lato-medium">
                  Equipo y Clientes
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {filteredPeople.map(renderMenuItem)}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* Presencia Digital */}
            {filteredDigital.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-sidebar-foreground/70 font-lato-medium">
                  Presencia Digital
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {filteredDigital.map(renderMenuItem)}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* Finanzas y Análisis */}
            {filteredFinance.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-sidebar-foreground/70 font-lato-medium">
                  Finanzas y Análisis
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {filteredFinance.map(renderMenuItem)}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* Expansión - Collapsible */}
            {filteredExpansion.length > 0 && (
              <SidebarGroup className="border-t border-sidebar-border/50 pt-2 mt-2">
                <Collapsible open={expansionOpen} onOpenChange={setExpansionOpen}>
                  <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1.5 text-sidebar-foreground/70 hover:text-sidebar-foreground text-xs font-medium">
                    <span className="font-lato-medium">Expansión</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${expansionOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {filteredExpansion.map(renderMenuItem)}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarGroup>
            )}
          </>
        )}

        {/* ====== CONSULTANT NAVIGATION ====== */}
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

        {/* Settings - Always visible */}
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
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-2" />
          {!isCollapsed && <span className="font-lato-medium">Cerrar Sesión</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};
