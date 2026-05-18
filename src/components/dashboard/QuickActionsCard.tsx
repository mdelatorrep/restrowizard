import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, LucideIcon } from 'lucide-react';

export interface QuickAction {
  label: string;
  path: string;
  icon: LucideIcon;
}

interface Props {
  actions: QuickAction[];
  onNavigate: (path: string) => void;
}

export const QuickActionsCard: React.FC<Props> = ({ actions, onNavigate }) => (
  <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
    <CardHeader className="pb-2 sm:pb-4">
      <CardTitle className="font-headline text-base sm:text-lg">Acceso Rápido</CardTitle>
      <CardDescription className="font-lato-light text-xs sm:text-sm hidden sm:block">
        Módulos de gestión con IA
      </CardDescription>
    </CardHeader>
    <CardContent className="grid grid-cols-2 lg:grid-cols-1 gap-2">
      {(actions || []).map((action) => (
        <Button
          key={action.path}
          variant="outline"
          className="w-full justify-start gap-2 h-10 sm:h-11 text-xs sm:text-sm"
          onClick={() => onNavigate(action.path)}
        >
          <action.icon className="h-4 w-4 text-primary shrink-0" />
          <span className="truncate">{action.label}</span>
          <ChevronRight className="h-3 w-3 ml-auto text-muted-foreground shrink-0 hidden sm:block" />
        </Button>
      ))}
    </CardContent>
  </Card>
);
