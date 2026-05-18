import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Briefcase, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ConsultantQuickLinks() {
  const navigate = useNavigate();
  const links = [
    { label: 'Facturación', path: '/c/billing', Icon: DollarSign },
    { label: 'Configuración', path: '/c/settings', Icon: Briefcase },
  ];

  return (
    <Card>
      <CardContent className="pt-4 space-y-2">
        {links.map(({ label, path, Icon }) => (
          <Button
            key={path}
            variant="outline"
            className="w-full justify-between"
            onClick={() => navigate(path)}
          >
            <span className="flex items-center">
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
