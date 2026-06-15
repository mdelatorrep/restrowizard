import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, Target, Lightbulb, BarChart3 } from 'lucide-react';
import { AIBenchmark } from '@/hooks/useDiagnosis';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer } from 'recharts';

interface MaturityBenchmarkProps {
  benchmark: AIBenchmark;
}

/** Coerce cualquier valor (string IA, null, undefined) a número con fallback. */
const toNum = (v: unknown, fallback = 0): number => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
};

const MaturityBenchmark: React.FC<MaturityBenchmarkProps> = ({ benchmark }) => {
  const getStatusIcon = (status: 'above' | 'at' | 'below') => {
    switch (status) {
      case 'above':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'below':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: 'above' | 'at' | 'below') => {
    switch (status) {
      case 'above':
        return 'text-success';
      case 'below':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusBadge = (status: 'above' | 'at' | 'below') => {
    switch (status) {
      case 'above':
        return <Badge className="bg-success/20 text-success border-success/30">Por encima</Badge>;
      case 'below':
        return <Badge variant="destructive" className="bg-destructive/20">Por debajo</Badge>;
      default:
        return <Badge variant="secondary">En promedio</Badge>;
    }
  };

  // Normalizar valores numéricos (la IA puede devolver strings de negativa).
  const overallPercentile = Math.max(0, Math.min(100, toNum(benchmark.overall_percentile, 50)));
  const industryAvg = Math.max(0, Math.min(5, toNum(benchmark.industry_average, 2.5)));

  // Prepare data for radar chart
  const radarData = (benchmark.pillar_comparisons || []).map(p => ({
    pillar: (p.pillar_name || '').split(' ')[0] || 'Pilar',
    'Tu Score': toNum(p.user_score, 0),
    'Industria': toNum(p.industry_average, 2.5),
    fullName: p.pillar_name
  }));

  const chartConfig = {
    'Tu Score': {
      label: 'Tu Score',
      color: 'hsl(var(--primary))',
    },
    'Industria': {
      label: 'Promedio Industria',
      color: 'hsl(var(--muted-foreground))',
    },
  };

  return (
    <div className="space-y-6">
      {/* Overall Percentile Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-lato-medium mb-1">Tu posición en la industria</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-headline font-bold text-primary">
                  Top {100 - overallPercentile}%
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Superas al {overallPercentile}% de los restaurantes
              </p>
            </div>
            <div className="text-right">
              <BarChart3 className="h-12 w-12 text-primary/40 mb-2" />
              <p className="text-sm text-muted-foreground">
                Promedio industria: <span className="font-bold">{industryAvg.toFixed(1)}/5</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Radar Chart Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Target className="h-5 w-5 text-primary" />
            Comparación por Pilar
          </CardTitle>
          <CardDescription>
            Tu score vs. promedio de la industria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ChartContainer config={chartConfig}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="pillar" />
                <PolarRadiusAxis angle={30} domain={[0, 5]} />
                <Radar
                  name="Tu Score"
                  dataKey="Tu Score"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Radar
                  name="Industria"
                  dataKey="Industria"
                  stroke="hsl(var(--muted-foreground))"
                  fill="hsl(var(--muted-foreground))"
                  fillOpacity={0.1}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
                <Legend />
                <ChartTooltip content={<ChartTooltipContent />} />
              </RadarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      {/* Pillar by Pillar Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Detalle por Pilar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(benchmark.pillar_comparisons || []).map((pillar) => {
            const userScore = toNum(pillar.user_score, 0);
            const industryAverage = toNum(pillar.industry_average, 2.5);
            const percentile = Math.max(0, Math.min(100, toNum(pillar.percentile, 50)));
            const gap = toNum(pillar.gap, userScore - industryAverage);
            return (
              <div key={pillar.pillar_id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(pillar.status)}
                    <span className="font-lato-medium">{pillar.pillar_name}</span>
                  </div>
                  {getStatusBadge(pillar.status)}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Tu score</span>
                      <span className="font-bold text-primary">{userScore.toFixed(1)}</span>
                    </div>
                    <Progress value={(userScore / 5) * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Industria</span>
                      <span className="font-bold">{industryAverage.toFixed(1)}</span>
                    </div>
                    <Progress value={(industryAverage / 5) * 100} className="h-2 bg-muted [&>div]:bg-muted-foreground" />
                  </div>
                </div>

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Percentil {percentile}</span>
                  <span className={getStatusColor(pillar.status)}>
                    {gap > 0 ? '+' : ''}{gap.toFixed(2)} vs industria
                  </span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Top Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Lightbulb className="h-5 w-5 text-secondary" />
            Oportunidades de Mercado
          </CardTitle>
          <CardDescription>
            Basadas en tendencias actuales de la industria
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(benchmark.top_opportunities || []).map((opp, index) => (
            <div 
              key={index} 
              className="p-4 rounded-lg bg-secondary/5 border border-secondary/20"
            >
              <h4 className="font-lato-bold text-foreground mb-1">{opp.title}</h4>
              <p className="text-sm text-muted-foreground mb-2">{opp.description}</p>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-secondary" />
                <span className="text-xs text-secondary font-lato-medium">
                  {opp.industry_trend}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Competitive Insight */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div>
              <h4 className="font-lato-bold text-foreground mb-1">Insight Competitivo</h4>
              <p className="text-sm text-muted-foreground">
                {benchmark.competitive_insight}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaturityBenchmark;
