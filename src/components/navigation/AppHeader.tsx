import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, ChevronDown, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useUserType } from '@/hooks/useUserType';
import { supabase } from '@/integrations/supabase/client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useCopilotAlerts } from '@/hooks/useCopilotAlerts';
import { useBrandData } from '@/hooks/useBrandData';
import { cn } from '@/lib/utils';

export const AppHeader: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { userType } = useUserType();
  const { brand } = useBrandData();
  const [businessName, setBusinessName] = useState<string>('');
  const { alerts, unreadAlerts, markAsRead } = useCopilotAlerts();
  const brandLogo = userType === 'restaurant_owner' ? (brand?.logo_url || brand?.logo_square_url) : null;

  useEffect(() => {
    const fetchBusinessInfo = async () => {
      if (!user) return;

      if (userType === 'restaurant_owner') {
        const { data } = await supabase
          .from('restaurant_businesses')
          .select('name')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data?.name) setBusinessName(data.name);
      } else if (userType === 'consultant') {
        const { data } = await supabase
          .from('consultant_profiles')
          .select('company_name')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data?.company_name) setBusinessName(data.company_name);
      }
    };

    fetchBusinessInfo();
  }, [user, userType]);

  const handleLogout = async () => {
    await signOut();
  };

  const settingsPath = userType === 'restaurant_owner' ? '/r/settings' : '/c/settings';
  const allAlertsPath = userType === 'restaurant_owner' ? '/r/dashboard' : '/c/alerts';

  // P1-4: navigate to alert origin via action_url
  const handleAlertClick = (alertId: string, actionUrl: string | null) => {
    markAsRead(alertId);
    if (actionUrl) navigate(actionUrl);
  };

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <div className="flex flex-col">
          <h2 className="font-headline font-bold text-foreground text-lg">
            {businessName}
          </h2>
          <span className="text-xs text-muted-foreground font-lato-light">
            {userType === 'restaurant_owner' ? 'Panel de Restaurante' : 'Portal de Consultor'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* P1-4: Notifications dropdown with deep-link navigation */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadAlerts.length > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive">
                  {unreadAlerts.length > 9 ? '9+' : unreadAlerts.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Alertas</span>
              {unreadAlerts.length > 0 && (
                <Badge variant="secondary" className="text-xs">{unreadAlerts.length} sin leer</Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(alerts || []).length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                <Inbox className="h-6 w-6 opacity-50" />
                <p className="text-xs">Sin alertas pendientes</p>
              </div>
            ) : (
              <>
                {(alerts || []).slice(0, 6).map((alert) => (
                  <DropdownMenuItem
                    key={alert.id}
                    onClick={() => handleAlertClick(alert.id, alert.action_url)}
                    className={cn(
                      'flex flex-col items-start gap-1 py-2 cursor-pointer',
                      !alert.is_read && 'bg-accent/30'
                    )}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full flex-shrink-0',
                          alert.priority === 'critical' || alert.priority === 'high'
                            ? 'bg-destructive'
                            : 'bg-primary'
                        )}
                      />
                      <span className="text-sm font-medium truncate flex-1">{alert.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 pl-4">{alert.message}</p>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(allAlertsPath)} className="text-center justify-center text-primary text-sm">
                  Ver todas
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-lato-medium">
              {user?.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(settingsPath)}>
              Configuración
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/')}>
              Ir a Inicio
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
