import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PhaseAnalysis, PhaseId, PHASES } from '@/hooks/useBusinessOpening';
import { formatCurrencyByCountry, getCurrencyCode } from '@/data/constants';
import { 
  Scale, MapPin, ChefHat, Truck, Users, Megaphone, TrendingUp,
  Loader2, ChevronDown, ChevronUp, ExternalLink, RefreshCw, CheckCircle2, Clock, Sparkles, Eye
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  country?: string; // For dynamic currency
}

export function PhaseAnalysisCard({ phaseId, analysis, onAnalyze, isAnalyzing, country = 'México' }: PhaseAnalysisCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const prevAnalysisRef = useRef<PhaseAnalysis | undefined>(undefined);
  const phaseInfo = PHASES.find(p => p.id === phaseId);

  const hasAnalysis = !!analysis && analysis.status === 'completed';
  const currencyCode = getCurrencyCode(country);
  
  // Extract text from various possible formats - comprehensive extraction
  const extractAnalysisText = (): string | null => {
    const data = analysis?.analysis_data;
    if (!data) return null;
    
    // Direct string format
    if (typeof data === 'string') return data;
    
    // Object with text property (most common)
    if (data.text && typeof data.text === 'string') return data.text;
    
    // Object with analysis property
    if (data.analysis && typeof data.analysis === 'string') return data.analysis;
    
    // Nested in structured object
    if (data.structured?.text && typeof data.structured.text === 'string') return data.structured.text;
    
    // If data is an object but none of the above, try to find any string property
    for (const key of Object.keys(data)) {
      if (typeof data[key] === 'string' && data[key].length > 100) {
        return data[key];
      }
    }
    
    return null;
  };
  
  const analysisText = extractAnalysisText();

  // Auto-expand when analysis is completed (detected by change from undefined to defined)
  useEffect(() => {
    if (analysis && !prevAnalysisRef.current) {
      // Analysis just completed - auto expand and show success state
      setIsExpanded(true);
      setJustCompleted(true);
      
      // Clear the "just completed" highlight after 3 seconds
      const timer = setTimeout(() => setJustCompleted(false), 3000);
      return () => clearTimeout(timer);
    }
    prevAnalysisRef.current = analysis;
  }, [analysis]);

  return (
    <Card className={`transition-all duration-500 ${
      justCompleted 
        ? 'border-green-500 shadow-lg shadow-green-500/20 ring-2 ring-green-500/30' 
        : hasAnalysis 
          ? 'border-primary/30' 
          : ''
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-colors ${
              justCompleted 
                ? 'bg-green-500/20 text-green-600' 
                : hasAnalysis 
                  ? 'bg-primary/10 text-primary' 
                  : 'bg-muted text-muted-foreground'
            }`}>
              {justCompleted ? <Sparkles className="h-5 w-5 animate-pulse" /> : PHASE_ICONS[phaseId]}
            </div>
            <div>
              <CardTitle className="text-lg">{phaseInfo?.name}</CardTitle>
              <CardDescription className="text-sm">
                {justCompleted ? (
                  <span className="flex items-center gap-1 text-green-600 font-medium animate-pulse">
                    <Sparkles className="h-3 w-3" />
                    ¡Análisis listo! Revisa los resultados abajo
                  </span>
                ) : hasAnalysis ? (
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
          
          <div className="flex gap-2">
            {hasAnalysis && !isExpanded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(true)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver análisis
              </Button>
            )}
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
        </div>
      </CardHeader>

      {hasAnalysis && (
        <CardContent>
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                <span className="text-sm text-muted-foreground">
                  {isExpanded ? 'Ocultar análisis' : 'Ver análisis detallado'}
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
                <div className="flex gap-4 mb-4 flex-wrap">
                  {analysis.estimated_cost && (
                    <Badge variant="secondary" className="text-sm">
                      💰 Costo estimado: {formatCurrencyByCountry(analysis.estimated_cost, country)}
                    </Badge>
                  )}
                  {analysis.estimated_time_days && (
                    <Badge variant="secondary" className="text-sm">
                      ⏱️ Tiempo: ~{analysis.estimated_time_days} días
                    </Badge>
                  )}
                </div>
              )}

              {/* Analysis content */}
              <ScrollArea className="h-[400px] w-full rounded-md border p-4 bg-muted/30">
                {analysisText ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-table:border-collapse prose-th:border prose-th:border-border prose-th:bg-muted prose-th:p-2 prose-td:border prose-td:border-border prose-td:p-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysisText}</ReactMarkdown>
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
                  <h4 className="text-sm font-medium mb-2">📚 Fuentes consultadas:</h4>
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
