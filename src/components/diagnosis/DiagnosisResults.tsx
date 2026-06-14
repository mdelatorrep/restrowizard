import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BarChart3, Brain, Target, Sparkles, Loader2 } from 'lucide-react';
import MaturityChart from '@/components/MaturityChart';
import MaturityBenchmark from '@/components/MaturityBenchmark';
import MaturityInsights from '@/components/MaturityInsights';
import AIActionPlanComponent from '@/components/AIActionPlan';
import { maturityModel, getLevelFromScore, getLevelDescription } from '@/data/maturityModel';
import type { AIAnalysis, AIActionPlan, AIBenchmark, DiagnosisResult } from '@/hooks/useDiagnosis';


interface ExtendedDiagnosisResult extends DiagnosisResult {
  diagnosisId?: string;
}

interface Props {
  results: ExtendedDiagnosisResult;
  aiAnalysis: AIAnalysis | null;
  aiActionPlan: AIActionPlan | null;
  aiBenchmark: AIBenchmark | null;
}

export const DiagnosisResults = ({ results, aiAnalysis, aiActionPlan, aiBenchmark }: Props) => {
  const navigate = useNavigate();
  const overallLevel = getLevelFromScore(results.overallScore);

  return (
    <div className="min-h-screen bg-card p-4 md:p-8">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center bg-background p-8 rounded-2xl shadow-xl mb-6">
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-2">
            Tu Diagnóstico está Listo
          </h1>
          <p className="text-muted-foreground font-lato-light">
            Análisis completo con recomendaciones personalizadas de IA
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Resumen</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2" disabled={!aiAnalysis}>
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Insights IA</span>
            </TabsTrigger>
            <TabsTrigger value="benchmark" className="flex items-center gap-2" disabled={!aiBenchmark}>
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Benchmark</span>
            </TabsTrigger>
            <TabsTrigger value="action" className="flex items-center gap-2" disabled={!aiActionPlan}>
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Plan</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="w-full h-full min-h-[300px]">
                    <MaturityChart pillarScores={results.pillarScores} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-lato-bold text-muted-foreground">Nivel de Madurez General</h3>
                    <p className="text-5xl font-headline font-black text-secondary my-2" style={{ color: overallLevel.color }}>
                      {overallLevel.name}
                    </p>
                    <p className="text-muted-foreground font-lato-light mb-4">
                      {getLevelDescription(overallLevel.name)}
                    </p>
                    <p className="text-3xl font-bold text-primary">{results.overallScore.toFixed(1)}/5</p>
                  </div>
                </div>

                <div className="mt-8 grid sm:grid-cols-2 gap-4">
                  {maturityModel.pillars.map(pillar => {
                    const pillarScore = results.pillarScores[pillar.id];
                    const pillarLevel = getLevelFromScore(pillarScore);
                    return (
                      <div key={pillar.id} className="bg-muted/30 p-4 rounded-lg flex items-center">
                        <div
                          className="text-2xl w-10 h-10 flex items-center justify-center rounded-lg mr-3"
                          style={{ backgroundColor: `${pillarLevel.color}20`, color: pillarLevel.color }}
                        >
                          {pillar.icon}
                        </div>
                        <div className="flex-1">
                          <p className="font-lato-medium text-foreground text-sm">{pillar.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="font-lato-bold" style={{ color: pillarLevel.color }}>{pillarLevel.name}</p>
                            <span className="text-muted-foreground text-sm">({pillarScore.toFixed(1)}/5)</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights">
            {aiAnalysis ? (
              <MaturityInsights analysis={aiAnalysis} />
            ) : (
              <Card><CardContent className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Cargando análisis...</p>
              </CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="benchmark">
            {aiBenchmark ? (
              <MaturityBenchmark benchmark={aiBenchmark} />
            ) : (
              <Card><CardContent className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Cargando benchmark...</p>
              </CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="action">
            {aiActionPlan && results.diagnosisId ? (
              <AIActionPlanComponent
                actionPlan={aiActionPlan}
                diagnosisId={results.diagnosisId}
                diagnosisResult={results}
              />
            ) : (
              <Card><CardContent className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Cargando plan de acción...</p>
              </CardContent></Card>
            )}
          </TabsContent>
        </Tabs>

        <Card className="mt-6 border-2 border-dashed border-secondary">
          <CardContent className="p-6 text-center">
            <h3 className="text-2xl font-headline font-bold text-primary">¿Y ahora qué?</h3>
            <p className="my-3 text-muted-foreground font-lato-light">
              Tu diagnóstico está guardado. Accede a tu dashboard para ver tu progreso.
            </p>
            <Button size="lg" onClick={() => navigate('/r/dashboard')} className="font-lato-bold">
              Ir a mi Dashboard <Sparkles className="ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
