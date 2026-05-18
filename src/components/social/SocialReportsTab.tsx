import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface Report {
  id: string;
  report_date: string;
  total_mentions: number;
  positive_count: number;
  negative_count: number;
  avg_sentiment?: number | null;
  ai_summary?: string | null;
}

export const SocialReportsTab: React.FC<{ reports: Report[] }> = ({ reports }) => {
  if ((reports || []).length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Sparkles className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Sin reportes</h3>
          <p className="text-muted-foreground text-center mb-4">
            Genera reportes de sentimiento con análisis de IA
          </p>
          <Button>
            <Sparkles className="h-4 w-4 mr-2" />
            Generar Reporte
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map(report => (
        <Card key={report.id}>
          <CardHeader>
            <CardTitle className="text-lg">
              Reporte {format(new Date(report.report_date), 'PP', { locale: es })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Menciones</p>
                <p className="text-xl font-bold">{report.total_mentions}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Positivas</p>
                <p className="text-xl font-bold text-green-600">{report.positive_count}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Negativas</p>
                <p className="text-xl font-bold text-red-600">{report.negative_count}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-xl font-bold">{((report.avg_sentiment || 0) * 100).toFixed(0)}%</p>
              </div>
            </div>
            {report.ai_summary && (
              <div className="p-4 bg-primary/5 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-medium">Resumen IA</span>
                </div>
                <p className="text-sm">{report.ai_summary}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
