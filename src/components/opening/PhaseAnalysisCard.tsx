import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PhaseAnalysis, PhaseId, PHASES } from '@/hooks/useBusinessOpening';
import { 
  Scale, MapPin, ChefHat, Truck, Users, Megaphone, TrendingUp,
  Loader2, ChevronDown, ChevronUp, ExternalLink, RefreshCw, CheckCircle2, Clock
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const PHASE_ICONS: Record<string, React.ReactNode> = {
  legal_requirements: <Scale className="h-5 w-5" />,
  location_analysis: <MapPin className="h-5 w-5" />,
  equipment_setup: <ChefHat className="h-5 w-5" />,
  supplier_network: <Truck className="h-5 w-5" />,
  staffing_plan: <Users className="h-5 w-5" />,
  marketing_launch: <Megaphone className="h-5 w-5" />,
  financial_projection: <TrendingUp className="h-5 w-5" />,
};

interface PhaseAnalysisCardProps {
  phaseId: PhaseId;
  analysis?: PhaseAnalysis;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

export function PhaseAnalysisCard({ phaseId, analysis, onAnalyze, isAnalyzing }: PhaseAnalysisCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const phaseInfo = PHASES.find(p => p.id === phaseId);

  const hasAnalysis = !!analysis;
  const analysisText = analysis?.analysis_data?.text || 
    (typeof analysis?.analysis_data === 'string' ? analysis.analysis_data : null);

  return (
    <Card className={`transition-all ${hasAnalysis ? 'border-primary/30' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${hasAnalysis ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {PHASE_ICONS[phaseId]}
            </div>
            <div>
              <CardTitle className="text-lg">{phaseInfo?.name}</CardTitle>
              <CardDescription className="text-sm">
                {hasAnalysis ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    Análisis completado
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Pendiente de análisis
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
          
          <Button
            variant={hasAnalysis ? "outline" : "default"}
            size="sm"
            onClick={onAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analizando...
              </>
            ) : hasAnalysis ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </>
            ) : (
              'Analizar'
            )}
          </Button>
        </div>
      </CardHeader>

      {hasAnalysis && (
        <CardContent>
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                <span className="text-sm text-muted-foreground">
                  Ver análisis detallado
                </span>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-4">
              {/* Cost and time estimates */}
              {(analysis.estimated_cost || analysis.estimated_time_days) && (
                <div className="flex gap-4 mb-4">
                  {analysis.estimated_cost && (
                    <Badge variant="secondary" className="text-sm">
                      Costo estimado: ${analysis.estimated_cost.toLocaleString()} MXN
                    </Badge>
                  )}
                  {analysis.estimated_time_days && (
                    <Badge variant="secondary" className="text-sm">
                      Tiempo: ~{analysis.estimated_time_days} días
                    </Badge>
                  )}
                </div>
              )}

              {/* Analysis content */}
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                {analysisText ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{analysisText}</ReactMarkdown>
                  </div>
                ) : analysis.analysis_data ? (
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(analysis.analysis_data, null, 2)}
                  </pre>
                ) : (
                  <p className="text-muted-foreground">No hay datos de análisis disponibles.</p>
                )}
              </ScrollArea>

              {/* Sources */}
              {analysis.sources && analysis.sources.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Fuentes consultadas:</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.sources.map((source, index) => (
                      <a
                        key={index}
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {new URL(source).hostname}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamp */}
              <p className="text-xs text-muted-foreground mt-4">
                Actualizado: {new Date(analysis.created_at).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      )}
    </Card>
  );
}
