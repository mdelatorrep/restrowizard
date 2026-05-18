import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { BenchmarkComparison } from '@/components/ui/empty-state';

interface Member {
  id: string;
  name: string;
  position: string;
  performance_score: number;
  training_progress: number | null;
}

interface KPIs {
  activeStaff: number;
  totalStaff: number;
  avgTrainingProgress: number;
  needsAttention?: Member[];
}

interface Benchmarks {
  turnoverRate: number;
  trainingCompletion: number;
}

export const TalentNeedsAttention: React.FC<{ kpis: KPIs | null; benchmarks: Benchmarks | null }> = ({ kpis, benchmarks }) => (
  <>
    {kpis?.needsAttention && kpis.needsAttention.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><AlertTriangle className="mr-2 text-orange-500" />Requieren Atención</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpis.needsAttention.map((member) => (
              <div key={member.id} className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">{member.name}</h4>
                  <Badge variant="outline" className="text-orange-600">{member.performance_score}%</Badge>
                </div>
                <p className="text-xs text-muted-foreground capitalize mb-2">{member.position.replace('_', ' ')}</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Capacitación</span>
                    <span>{member.training_progress}%</span>
                  </div>
                  <Progress value={member.training_progress || 0} className="h-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )}

    {benchmarks && (
      <Card>
        <CardHeader>
          <CardTitle>Comparación con Industria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BenchmarkComparison label="Tasa de Rotación"
              userValue={100 - (kpis?.activeStaff || 0) / (kpis?.totalStaff || 1) * 100}
              benchmarkValue={benchmarks.turnoverRate} higherIsBetter={false} />
            <BenchmarkComparison label="Completación de Capacitación"
              userValue={kpis?.avgTrainingProgress || 0}
              benchmarkValue={benchmarks.trainingCompletion} higherIsBetter={true} />
          </div>
        </CardContent>
      </Card>
    )}
  </>
);
