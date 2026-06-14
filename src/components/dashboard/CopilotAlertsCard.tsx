import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Lightbulb, ChevronRight } from 'lucide-react';

export interface DashboardAlert {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  action?: string;
}

interface Props {
  alerts: DashboardAlert[];
  unreadCount: number;
}

export const CopilotAlertsCard: React.FC<Props> = ({ alerts, unreadCount }) => (
  <Card className="lg:col-span-2 border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
    <CardHeader className="pb-2 sm:pb-4">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 font-headline text-base sm:text-lg">
            <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
            Co-Piloto RestroWizard
          </CardTitle>
          <CardDescription className="font-lato-light text-xs sm:text-sm hidden sm:block">
            Alertas y recomendaciones basadas en tus datos
          </CardDescription>
        </div>
        {unreadCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {unreadCount} {unreadCount === 1 ? 'nueva' : 'nuevas'}
          </Badge>
        )}
      </div>
    </CardHeader>
    <CardContent className="space-y-2 sm:space-y-3">
      {(!alerts || alerts.length === 0) ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Sin alertas activas. El Co-Piloto te avisará cuando detecte algo importante.
        </div>
      ) : (
        alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-3 sm:p-4 rounded-xl border ${
              alert.type === 'warning'
                ? 'bg-warning/5 border-warning/20'
                : alert.type === 'success'
                ? 'bg-success/5 border-success/20'
                : 'bg-info/5 border-info/20'
            }`}
          >
            <div className="flex items-start gap-2 sm:gap-3">
              <div
                className={`p-1 sm:p-1.5 rounded-full shrink-0 ${
                  alert.type === 'warning'
                    ? 'bg-warning/20'
                    : alert.type === 'success'
                    ? 'bg-success/20'
                    : 'bg-info/20'
                }`}
              >
                {alert.type === 'warning' ? (
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-warning" />
                ) : (
                  <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4 text-info" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-lato-bold text-xs sm:text-sm line-clamp-1">{alert.title}</h4>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2">
                  {alert.message}
                </p>
                {alert.action && (
                  <Button variant="link" className="p-0 h-auto mt-1 sm:mt-2 text-primary text-xs sm:text-sm">
                    {alert.action} <ChevronRight className="h-3 w-3 ml-0.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </CardContent>
  </Card>
);
