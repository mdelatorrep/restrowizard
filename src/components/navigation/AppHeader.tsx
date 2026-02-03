import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, ChevronDown } from 'lucide-react';
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

export const AppHeader: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { userType } = useUserType();
  const [businessName, setBusinessName] = useState<string>('');
  const [unreadAlerts, setUnreadAlerts] = useState(0);

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
        setBusinessName(data?.name || 'Mi Restaurante');
      } else if (userType === 'consultant') {
        const { data } = await supabase
          .from('consultant_profiles')
          .select('company_name')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        setBusinessName(data?.company_name || 'Mi Consultoría');
      }
    };

    const fetchAlerts = async () => {
      if (!user) return;
      const { count } = await supabase
        .from('copilot_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      setUnreadAlerts(count || 0);
    };

    fetchBusinessInfo();
    fetchAlerts();
  }, [user, userType]);

  const handleLogout = async () => {
    // signOut now handles navigation internally with a hard refresh
    await signOut();
  };

  const settingsPath = userType === 'restaurant_owner' ? '/r/settings' : '/c/settings';

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
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => navigate(userType === 'restaurant_owner' ? '/r/dashboard' : '/c/alerts')}
        >
          <Bell className="h-5 w-5" />
          {unreadAlerts > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive"
            >
              {unreadAlerts > 9 ? '9+' : unreadAlerts}
            </Badge>
          )}
        </Button>

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
