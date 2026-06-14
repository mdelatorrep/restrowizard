import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Props {
  greeting: string;
  currentTime: string;
  businessName: string;
  userName?: string;
}

export const DashboardHero: React.FC<Props> = ({ greeting, currentTime, businessName, userName }) => {
  const navigate = useNavigate();
  const displayName = (userName || '').trim().split(' ')[0] || 'bienvenido';
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-headline font-bold text-foreground truncate">
            {greeting}, Carlos
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-lato-light capitalize truncate">
            {currentTime} • {businessName}
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 ml-2 hidden sm:flex">
          <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse" />
          En línea
        </Badge>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/diagnosis')}
          className="shrink-0 text-xs sm:text-sm"
        >
          Ver Diagnóstico
        </Button>
        <Button
          size="sm"
          onClick={() => navigate('/r/finances')}
          className="shrink-0 text-xs sm:text-sm"
        >
          Ver Reportes
        </Button>
      </div>
    </div>
  );
};
