import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Zap, Shield, TrendingUp, Sparkles } from 'lucide-react';
import { AIAnalysis } from '@/hooks/useDiagnosis';

interface MaturityInsightsProps {
  analysis: AIAnalysis;
}

const MaturityInsights: React.FC<MaturityInsightsProps> = ({ analysis }) => {
  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <Card className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Sparkles className="h-5 w-5 text-primary" />
            Resumen Ejecutivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-lato-light leading-relaxed text-foreground">
            {analysis.executive_summary}
          </p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card className="border-success/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline text-success">
              <CheckCircle2 className="h-5 w-5" />
              Fortalezas
            </CardTitle>
            <CardDescription>Lo que estás haciendo bien</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(analysis.strengths || []).map((strength, index) => (
              <div 
                key={index} 
                className="p-3 rounded-lg bg-success/5 border border-success/20"
              >
                <Badge variant="outline" className="mb-2 border-success/30 text-success">
                  {strength.pillar}
                </Badge>
                <p className="text-sm text-muted-foreground">{strength.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Critical Areas */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Áreas Críticas
            </CardTitle>
            <CardDescription>Requieren atención inmediata</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(analysis.critical_areas || []).map((area, index) => (
              <div 
                key={index} 
                className="p-3 rounded-lg bg-destructive/5 border border-destructive/20"
              >
                <Badge variant="outline" className="mb-2 border-destructive/30 text-destructive">
                  {area.pillar}
                </Badge>
                <p className="text-sm font-lato-medium text-foreground mb-1">{area.issue}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Impacto:</span> {area.impact}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Opportunity */}
      <Card className="border-secondary/30 bg-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline text-secondary">
            <Zap className="h-5 w-5" />
            Oportunidad Rápida
          </CardTitle>
          <CardDescription>Acción de alto impacto a corto plazo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-xl font-lato-bold text-foreground">
                {analysis.quick_opportunity.title}
              </h4>
              <p className="text-muted-foreground mt-1">
                {analysis.quick_opportunity.description}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-background/60">
                <p className="text-xs text-muted-foreground mb-1">Impacto Esperado</p>
                <p className="text-sm font-lato-medium text-foreground">
                  {analysis.quick_opportunity.expected_impact}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-background/60">
                <p className="text-xs text-muted-foreground mb-1">Tiempo de Implementación</p>
                <p className="text-sm font-lato-medium text-foreground">
                  {analysis.quick_opportunity.timeframe}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Risk */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline text-amber-600">
            <Shield className="h-5 w-5" />
            Riesgo Principal
          </CardTitle>
          <CardDescription>Lo que podría pasar si no actúas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <h4 className="text-lg font-lato-bold text-foreground">
              {analysis.main_risk.title}
            </h4>
            <p className="text-muted-foreground">
              {analysis.main_risk.description}
            </p>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm">
                <span className="font-lato-bold text-amber-600">Consecuencias: </span>
                <span className="text-muted-foreground">{analysis.main_risk.consequences}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaturityInsights;
