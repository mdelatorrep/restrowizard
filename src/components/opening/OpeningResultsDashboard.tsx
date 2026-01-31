import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Rocket, DollarSign, Calendar, TrendingUp, Clock, 
  CheckCircle2, ListChecks, FileText, ChevronRight,
  Scale, MapPin, ChefHat, Truck, Users, Megaphone,
  AlertTriangle, Sparkles, ArrowRight, RefreshCcw, Loader2,
  Pencil, RotateCw, Target, Zap, Award, BarChart3, Download
} from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { BusinessProject, PhaseAnalysis, ChecklistItem } from '@/hooks/useBusinessProject';
import { PHASES, PhaseId } from '@/hooks/useBusinessOpening';
import { cn } from '@/lib/utils';
import { EditProjectDetailsDialog } from './EditProjectDetailsDialog';
import { AnalysisContentRenderer } from './AnalysisContentRenderer';
import { OpeningPlanPDF } from './OpeningPlanPDF';
import { formatCurrencyByCountry, getCurrencySymbol, getCurrencyCode } from '@/data/constants';
import { LinkifyText } from '@/lib/linkifyText';

interface OpeningResultsDashboardProps {
  project: BusinessProject;
  analyses: PhaseAnalysis[];
  checklist: ChecklistItem[];
  onToggleChecklistItem: (itemId: string, isCompleted: boolean) => void;
  onGenerateChecklist?: () => Promise<unknown> | void;
  isGeneratingChecklist?: boolean;
  onRefreshData?: () => Promise<unknown> | void;
  isRefreshing?: boolean;
  onComplete: () => void;
  isCompleting?: boolean;
  onUpdateProject?: (data: Partial<BusinessProject>) => Promise<void>;
  onRegenerateAll?: () => Promise<void>;
  isRegenerating?: boolean;
  needsRegeneration?: boolean;
}

const PHASE_ICONS: Record<PhaseId, React.ElementType> = {
  legal_requirements: Scale,
  location_analysis: MapPin,
  equipment_setup: ChefHat,
  supplier_network: Truck,
  staffing_plan: Users,
  marketing_launch: Megaphone,
  financial_projection: TrendingUp,
};

const PHASE_COLORS: Record<PhaseId, { bg: string; text: string; border: string }> = {
  legal_requirements: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/30' },
  location_analysis: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30' },
  equipment_setup: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/30' },
  supplier_network: { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', border: 'border-green-500/30' },
  staffing_plan: { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/30' },
  marketing_launch: { bg: 'bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-500/30' },
  financial_projection: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30' },
};

const PHASE_DESCRIPTIONS: Record<PhaseId, string> = {
  legal_requirements: 'Permisos, licencias y requisitos legales',
  location_analysis: 'Análisis de la zona y competencia',
  equipment_setup: 'Equipamiento y mobiliario necesario',
  supplier_network: 'Proveedores y cadena de suministro',
  staffing_plan: 'Estructura de personal y contratación',
  marketing_launch: 'Estrategia de marketing y lanzamiento',
  financial_projection: 'Proyecciones financieras y ROI',
};

export function OpeningResultsDashboard({
  project,
  analyses,
  checklist,
  onToggleChecklistItem,
  onGenerateChecklist,
  isGeneratingChecklist,
  onRefreshData,
  isRefreshing,
  onComplete,
  isCompleting,
  onUpdateProject,
  onRegenerateAll,
  isRegenerating,
  needsRegeneration,
}: OpeningResultsDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Debug logging for analyses data
  console.debug('[OpeningResultsDashboard] Render', {
    projectId: project?.id,
    analysesCount: analyses?.length,
    checklistCount: checklist?.length,
    analysesPhases: analyses?.map(a => ({ phase: a.phase, status: a.status, hasData: !!a.analysis_data })),
  });

  // Calculate metrics from analyses
  const metrics = useMemo(() => {
    // Use project's estimated budget as the primary investment source
    let totalInvestment = project.estimated_budget || 0;
    let monthlyOperatingCost = 0;
    let estimatedRevenue = 0;

    // If we have phase analyses with estimated_cost, add them up
    analyses.forEach(analysis => {
      if (analysis.estimated_cost) {
        if (!project.estimated_budget) {
          // Only use analysis costs if no project budget was set
          if (analysis.phase === 'financial_projection') {
            totalInvestment += analysis.estimated_cost * 0.4;
            monthlyOperatingCost += analysis.estimated_cost * 0.1;
            estimatedRevenue += analysis.estimated_cost * 0.15;
          } else {
            totalInvestment += analysis.estimated_cost;
          }
        }
      }
    });

    // Calculate operating costs and revenue based on investment (industry benchmarks)
    // For restaurants: monthly operating cost is typically 8-12% of total investment
    // Monthly revenue target is typically 12-18% of investment to be profitable
    if (monthlyOperatingCost === 0 && totalInvestment > 0) {
      monthlyOperatingCost = totalInvestment * 0.10; // 10% of investment
    }
    if (estimatedRevenue === 0 && totalInvestment > 0) {
      estimatedRevenue = totalInvestment * 0.15; // 15% of investment as target
    }

    // Calculate break-even months
    const monthlyProfit = estimatedRevenue - monthlyOperatingCost;
    let breakEvenMonths = 12;
    if (monthlyProfit > 0 && totalInvestment > 0) {
      breakEvenMonths = Math.ceil(totalInvestment / monthlyProfit);
    }

    // Calculate annual ROE (Return on Equity)
    // ROE = (Annual Net Profit / Total Investment) * 100
    const annualProfit = monthlyProfit * 12;
    const roi = totalInvestment > 0 ? (annualProfit / totalInvestment) * 100 : 0;

    return {
      totalInvestment,
      monthlyOperatingCost,
      estimatedRevenue,
      breakEvenMonths: Math.min(Math.max(breakEvenMonths, 6), 36), // Between 6-36 months
      roi: Math.max(roi, 0), // Ensure non-negative
    };
  }, [analyses, project.estimated_budget]);

  // Phase order and labels for checklist display
  const CHECKLIST_PHASE_ORDER = [
    'planning',
    'legal',
    'location',
    'equipment',
    'suppliers',
    'staffing',
    'marketing',
    'pre_opening',
    'opening',
  ];

  const CHECKLIST_PHASE_LABELS: Record<string, string> = {
    planning: 'Planeación',
    legal: 'Legal y Permisos',
    location: 'Ubicación',
    equipment: 'Equipamiento',
    suppliers: 'Proveedores',
    staffing: 'Personal',
    marketing: 'Marketing',
    pre_opening: 'Pre-Apertura',
    opening: 'Apertura',
  };

  const CHECKLIST_PHASE_ICONS: Record<string, React.ElementType> = {
    planning: TrendingUp,
    legal: Scale,
    location: MapPin,
    equipment: ChefHat,
    suppliers: Truck,
    staffing: Users,
    marketing: Megaphone,
    pre_opening: Clock,
    opening: Rocket,
  };

  // Group checklist by phase
  const groupedChecklist = useMemo(() => {
    const groups: Record<string, ChecklistItem[]> = {};
    checklist.forEach(item => {
      const phase = item.phase || 'planning';
      if (!groups[phase]) groups[phase] = [];
      groups[phase].push(item);
    });
    // Sort items within each phase by sort_order
    Object.keys(groups).forEach(phase => {
      groups[phase].sort((a, b) => a.sort_order - b.sort_order);
    });
    return groups;
  }, [checklist]);

  // Get ordered phases that have items
  const orderedChecklistPhases = useMemo(() => {
    return CHECKLIST_PHASE_ORDER.filter(phase => groupedChecklist[phase]?.length > 0);
  }, [groupedChecklist]);

  // Calculate checklist progress
  const checklistProgress = useMemo(() => {
    if (checklist.length === 0) return 0;
    const completed = checklist.filter(item => item.is_completed).length;
    return (completed / checklist.length) * 100;
  }, [checklist]);

  // Get urgent items (first 5 incomplete)
  const urgentItems = useMemo(() => {
    return checklist
      .filter(item => !item.is_completed)
      .slice(0, 5);
  }, [checklist]);

  // Days until opening
  const daysUntilOpening = useMemo(() => {
    if (!project.target_opening_date) return null;
    const target = new Date(project.target_opening_date);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [project.target_opening_date]);

  // Use dynamic currency based on project country
  const formatCurrency = (value: number) => {
    return formatCurrencyByCountry(value, project.country);
  };

  const currencySymbol = getCurrencySymbol(project.country);
  const currencyCode = getCurrencyCode(project.country);

  const hasChecklist = checklist.length > 0;
  const investmentLabel = metrics.totalInvestment > 0 ? formatCurrency(metrics.totalInvestment) : 'Por definir';
  const roiLabel = metrics.totalInvestment > 0 ? `${metrics.roi.toFixed(0)}%` : '—';

  // Extract text content from analysis_data - robust extraction
  const getAnalysisContent = (analysis: PhaseAnalysis): string => {
    const data = analysis?.analysis_data;
    
    // Debug logging for troubleshooting
    console.debug('[getAnalysisContent]', { phase: analysis?.phase, dataType: typeof data, hasData: !!data });
    
    if (!data) {
      return 'Sin contenido de análisis disponible.';
    }
    
    // Direct string format
    if (typeof data === 'string') {
      return data;
    }
    
    // Object with text property (most common format from our edge function)
    if (typeof data === 'object' && data !== null) {
      // Check for text property first (primary format)
      if ('text' in data && typeof data.text === 'string' && data.text.length > 0) {
        return data.text;
      }
      
      // Check for analysis property
      if ('analysis' in data && typeof data.analysis === 'string' && data.analysis.length > 0) {
        return data.analysis;
      }
      
      // Check in structured object
      if ('structured' in data && data.structured && typeof data.structured === 'object') {
        const structured = data.structured as Record<string, unknown>;
        if ('text' in structured && typeof structured.text === 'string') {
          return structured.text;
        }
      }
      
      // Try to find any string property with substantial content
      const keys = Object.keys(data);
      for (const key of keys) {
        const value = (data as Record<string, unknown>)[key];
        if (typeof value === 'string' && value.length > 100) {
          return value;
        }
      }
      
      // Last resort: stringify for debugging
      return JSON.stringify(data, null, 2);
    }
    
    return 'Sin contenido de análisis disponible.';
  };

  // Extract recommendations from analysis_data or recommendations field
  const getRecommendations = (analysis: PhaseAnalysis): string[] => {
    if (Array.isArray(analysis.recommendations)) {
      return analysis.recommendations;
    }
    if (analysis.analysis_data?.structured?.recommendations) {
      return analysis.analysis_data.structured.recommendations;
    }
    // Try to extract key points from the text content
    const textContent = getAnalysisContent(analysis);
    if (textContent && textContent.length > 100) {
      // Extract bullet points that contain actual content (not just headers)
      const lines = textContent.split('\n').filter(line => {
        const trimmed = line.trim();
        // Skip empty lines and short headers
        if (trimmed.length < 15) return false;
        // Skip lines that are just section headers
        if (trimmed.match(/^#+\s*(Resumen|Puntos|Próximo|Inversión|Costos|Métricas|---)/i)) return false;
        // Include bullet points with actual content
        if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('→')) {
          return trimmed.length > 20 && trimmed.length < 200;
        }
        return false;
      });
      return lines.slice(0, 4).map(l => 
        l.replace(/^[-•→]+\s*/, '')
         .replace(/\*\*/g, '')
         .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links but keep text
         .trim()
      );
    }
    return [];
  };

  // Extract a key metric or highlight from analysis for display
  const getPhaseHighlight = (analysis: PhaseAnalysis, phaseId: PhaseId): { label: string; value: string } | null => {
    const textContent = getAnalysisContent(analysis);
    
    // Try to find key numbers/metrics based on phase type
    const patterns: Record<PhaseId, RegExp[]> = {
      legal_requirements: [/(\d+)\s*(permisos?|licencias?|días?)/i, /(RUT|NIT|Sayco)/i],
      location_analysis: [/(\d+)\s*(m²|metros)/i, /arriendos?\s*[:\s]*\$?\s*([\d,.]+)/i],
      equipment_setup: [/\$([\d,.]+)\s*[–-]\s*\$([\d,.]+)/i, /(\d+[-–]\d+)\s*(indispensables|equipos)/i],
      supplier_network: [/(\d+)\s*(proveedores?|días?)/i, /margen\s*[:\s]*(\d+%)/i],
      staffing_plan: [/(\d+)\s*(FTE|empleados?|personas?)/i, /nómina\s*[:\s]*\$?([\d,.]+)/i],
      marketing_launch: [/(\d+)\s*(días?|semanas?)/i, /WhatsApp|Instagram|redes/i],
      financial_projection: [/≥?(\d+)\s*tickets?\/día/i, /ROI\s*[:\s]*(\d+%)/i, /break.?even\s*[:\s]*(\d+)/i],
    };

    const phasePatterns = patterns[phaseId] || [];
    for (const pattern of phasePatterns) {
      const match = textContent.match(pattern);
      if (match) {
        // Return a formatted highlight based on phase
        switch (phaseId) {
          case 'legal_requirements':
            return { label: 'Trámites', value: match[0].includes('días') ? match[0] : `${match[1]} requeridos` };
          case 'location_analysis':
            return { label: 'Referencia', value: match[0].substring(0, 30) };
          case 'equipment_setup':
            return { label: 'Inversión', value: match[0].substring(0, 25) };
          case 'supplier_network':
            return { label: 'Red', value: match[0].substring(0, 25) };
          case 'staffing_plan':
            return { label: 'Equipo', value: match[1] + ' ' + (match[2] || 'personas') };
          case 'marketing_launch':
            return { label: 'Estrategia', value: match[0].substring(0, 25) };
          case 'financial_projection':
            return { label: 'Meta', value: match[0].substring(0, 25) };
        }
      }
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Edit Dialog */}
      {onUpdateProject && (
        <EditProjectDetailsDialog
          project={project}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={onUpdateProject}
        />
      )}

      {/* Success Header */}
      <div className="relative text-center py-8 bg-gradient-to-b from-primary/5 to-transparent rounded-xl">
        <div className="absolute right-4 top-4 flex gap-2">
          {/* PDF Download Button */}
          <PDFDownloadLink
            document={
              <OpeningPlanPDF
                project={project}
                analyses={analyses}
                checklist={checklist}
                metrics={metrics}
              />
            }
            fileName={`Plan-Apertura-${project.project_name.replace(/\s+/g, '-')}.pdf`}
          >
            {({ loading }) => (
              <Button
                variant="outline"
                size="sm"
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Descargar PDF
                  </>
                )}
              </Button>
            )}
          </PDFDownloadLink>
          
          {onUpdateProject && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
          )}
          {onRefreshData && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void onRefreshData()}
              disabled={!!isRefreshing}
              className="gap-2"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Recargando…
                </>
              ) : (
                <>
                  <RefreshCcw className="h-4 w-4" />
                  Recargar
                </>
              )}
            </Button>
          )}
        </div>
        <div className="inline-flex items-center justify-center p-4 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-3xl font-bold mb-2">
          ¡Tu Plan de Apertura está Listo!
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Hemos analizado todos los aspectos de tu proyecto <strong>{project.project_name}</strong> y 
          generado un plan personalizado para {project.city}, {project.country}.
        </p>

        {/* Regenerate Plan Banner */}
        {needsRegeneration && onRegenerateAll && (
          <div className="mt-4 inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-4 py-2 rounded-lg">
            <RotateCw className="h-4 w-4" />
            <span className="text-sm font-medium">Has editado los datos del proyecto.</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void onRegenerateAll()}
              disabled={isRegenerating}
              className="ml-2 bg-amber-200 dark:bg-amber-800 border-amber-300 dark:border-amber-700"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Regenerando…
                </>
              ) : (
                'Regenerar Plan'
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Key Metrics - Enhanced with WOW effect */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-lg hover:shadow-xl transition-all duration-300 group">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-colors" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/20 rounded-xl shadow-inner">
                <DollarSign className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Inversión Total</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  {investmentLabel}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{currencyCode}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-green-500/30 bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent shadow-lg hover:shadow-xl transition-all duration-300 group">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-green-500/10 blur-2xl group-hover:bg-green-500/20 transition-colors" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/20 rounded-xl shadow-inner">
                <TrendingUp className="h-7 w-7 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">ROI Anual</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{roiLabel}</p>
                <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-0.5 flex items-center gap-1">
                  <Zap className="h-3 w-3" /> Retorno proyectado
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent shadow-lg hover:shadow-xl transition-all duration-300 group">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl group-hover:bg-blue-500/20 transition-colors" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-xl shadow-inner">
                <Target className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Break-Even</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metrics.breakEvenMonths} meses</p>
                <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-0.5">Punto de equilibrio</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent shadow-lg hover:shadow-xl transition-all duration-300 group">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-orange-500/10 blur-2xl group-hover:bg-orange-500/20 transition-colors" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500/20 rounded-xl shadow-inner">
                <Calendar className="h-7 w-7 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Countdown</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {daysUntilOpening !== null ? `${daysUntilOpening}` : '—'}
                </p>
                <p className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-0.5">
                  {daysUntilOpening !== null ? 'días hasta apertura' : 'Fecha por definir'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="checklist" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Checklist ({checklist.filter(c => c.is_completed).length}/{checklist.length})
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Análisis Detallado
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Urgent Actions */}
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-lg">Acciones Inmediatas</CardTitle>
              </div>
              <CardDescription>
                Las primeras 5 tareas que debes completar para comenzar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {urgentItems.length > 0 ? (
                <div className="space-y-3">
                  {urgentItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <Badge variant="outline" className="mt-0.5">
                        {index + 1}
                      </Badge>
                      <div className="flex-1">
                        <p className="font-medium">{item.title}</p>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <Checkbox
                        checked={item.is_completed}
                        onCheckedChange={(checked) =>
                          onToggleChecklistItem(item.id, checked as boolean)
                        }
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Aún no se generó el checklist para este proyecto.
                  </p>
                  {onGenerateChecklist && (
                    <Button
                      variant="outline"
                      onClick={() => void onGenerateChecklist()}
                      disabled={!!isGeneratingChecklist}
                      className="w-full"
                    >
                      {isGeneratingChecklist ? 'Generando checklist…' : 'Generar checklist ahora'}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Phase Summary Cards - Enhanced Strategic Layout */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PHASES.map(phase => {
              const analysis = analyses.find(a => a.phase === phase.id);
              const Icon = PHASE_ICONS[phase.id];
              const colors = PHASE_COLORS[phase.id];
              
              if (!analysis) return null;

              const recommendations = getRecommendations(analysis);
              const highlight = getPhaseHighlight(analysis, phase.id);
              const timeEstimate = analysis.estimated_time_days;
              const costEstimate = analysis.estimated_cost;

              return (
                <Card 
                  key={phase.id} 
                  className={cn(
                    "relative overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer",
                    colors.border
                  )}
                  onClick={() => setActiveTab('details')}
                >
                  {/* Gradient overlay */}
                  <div className={cn("absolute inset-0 opacity-30", colors.bg)} />
                  
                  <CardHeader className="pb-2 relative">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2.5 rounded-xl shadow-sm", colors.bg)}>
                          <Icon className={cn("h-5 w-5", colors.text)} />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-semibold">{phase.name}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">{PHASE_DESCRIPTIONS[phase.id]}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="relative pt-0 space-y-3">
                    {/* Key highlight metric */}
                    {highlight && (
                      <div className={cn("p-2.5 rounded-lg border", colors.bg, colors.border)}>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{highlight.label}</p>
                        <LinkifyText className={cn("text-sm font-semibold mt-0.5 block", colors.text)}>
                          {highlight.value}
                        </LinkifyText>
                      </div>
                    )}
                    
                    {/* Key metrics badges */}
                    <div className="flex gap-2 flex-wrap">
                      {costEstimate && (
                        <Badge variant="outline" className={cn("text-xs", colors.text, colors.border)}>
                          <DollarSign className="h-3 w-3 mr-0.5" />
                          {currencySymbol}{costEstimate.toLocaleString()}
                        </Badge>
                      )}
                      {timeEstimate && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {timeEstimate} días
                        </Badge>
                      )}
                    </div>
                    
                    {/* Strategic insights - show up to 3 */}
                    {recommendations.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Puntos Clave</p>
                        {recommendations.slice(0, 3).map((rec, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5", colors.text.replace('text-', 'bg-'))} />
                            <LinkifyText className="text-foreground/80 line-clamp-2 block">
                              {rec}
                            </LinkifyText>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Fallback if no recommendations */}
                    {recommendations.length === 0 && !highlight && (
                      <p className="text-xs text-muted-foreground italic">
                        Análisis completado. Haz clic para ver detalles.
                      </p>
                    )}
                    
                    {/* Hover indicator */}
                    <div className="flex items-center justify-end pt-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Ver análisis completo</span>
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Checklist Tab */}
        <TabsContent value="checklist" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Checklist de Apertura</CardTitle>
                  <CardDescription>
                    {checklist.filter(c => c.is_completed).length} de {checklist.length} tareas completadas
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {Math.round(checklistProgress)}%
                  </p>
                </div>
              </div>
              <Progress value={checklistProgress} className="h-2 mt-2" />
            </CardHeader>
            <CardContent>
              {!hasChecklist ? (
                <div className="space-y-3 py-6">
                  <p className="text-sm text-muted-foreground">
                    No hay tareas aún. Genera un checklist para empezar con acciones concretas.
                  </p>
                  {onGenerateChecklist && (
                    <Button
                      variant="outline"
                      onClick={() => void onGenerateChecklist()}
                      disabled={!!isGeneratingChecklist}
                      className="w-full"
                    >
                      {isGeneratingChecklist ? 'Generando checklist…' : 'Generar checklist'}
                    </Button>
                  )}
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <Accordion type="multiple" defaultValue={orderedChecklistPhases} className="space-y-2">
                    {orderedChecklistPhases.map((phase, phaseIndex) => {
                      const items = groupedChecklist[phase];
                      const completedInPhase = items.filter(i => i.is_completed).length;
                      const allCompleted = completedInPhase === items.length;
                      const Icon = CHECKLIST_PHASE_ICONS[phase] || ListChecks;
                      const phaseName = CHECKLIST_PHASE_LABELS[phase] || phase;

                      return (
                        <AccordionItem
                          key={phase}
                          value={phase}
                          className={cn(
                            "border rounded-lg px-4 transition-colors",
                            allCompleted && "bg-green-50/50 dark:bg-green-950/10 border-green-200 dark:border-green-800"
                          )}
                        >
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold",
                                allCompleted 
                                  ? "bg-green-500 text-white" 
                                  : "bg-primary/10 text-primary"
                              )}>
                                {phaseIndex + 1}
                              </div>
                              <Icon className={cn(
                                "h-5 w-5",
                                allCompleted ? "text-green-600" : "text-primary"
                              )} />
                              <span className="font-medium">
                                {phaseName}
                              </span>
                              <Badge variant={allCompleted ? "default" : "secondary"} className={cn(
                                allCompleted && "bg-green-500"
                              )}>
                                {completedInPhase}/{items.length}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 pt-2">
                              {items.map(item => (
                                <div
                                  key={item.id}
                                  className={cn(
                                    "flex items-start gap-3 p-3 rounded-lg transition-colors",
                                    item.is_completed
                                      ? "bg-green-50 dark:bg-green-950/20"
                                      : "bg-muted/50 hover:bg-muted"
                                  )}
                                >
                                  <Checkbox
                                    checked={item.is_completed}
                                    onCheckedChange={(checked) =>
                                      onToggleChecklistItem(item.id, checked as boolean)
                                    }
                                    className="mt-0.5"
                                  />
                                  <div className="flex-1">
                                    <p className={cn(
                                      "font-medium",
                                      item.is_completed && "line-through text-muted-foreground"
                                    )}>
                                      {item.title}
                                    </p>
                                    {item.description && (
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="space-y-3">
                {PHASES.map(phase => {
                  const analysis = analyses.find(a => a.phase === phase.id);
                  const Icon = PHASE_ICONS[phase.id];
                  const colors = PHASE_COLORS[phase.id];
                  
                  if (!analysis) return null;

                  const content = getAnalysisContent(analysis);
                  const costEstimate = analysis.estimated_cost;
                  const timeEstimate = analysis.estimated_time_days;

                  return (
                    <AccordionItem
                      key={phase.id}
                      value={phase.id}
                      className={cn(
                        "border rounded-xl overflow-hidden transition-all",
                        colors.border
                      )}
                    >
                      <AccordionTrigger className="hover:no-underline px-5 py-4 data-[state=open]:bg-muted/30">
                        <div className="flex items-center gap-4 w-full">
                          <div className={cn("p-3 rounded-xl shadow-sm", colors.bg)}>
                            <Icon className={cn("h-6 w-6", colors.text)} />
                          </div>
                          <div className="text-left flex-1">
                            <p className="font-semibold text-base">{phase.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {PHASE_DESCRIPTIONS[phase.id]}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {costEstimate && (
                              <Badge variant="secondary" className="text-xs">
                                <DollarSign className="h-3 w-3 mr-1" />
                                {currencySymbol}{costEstimate.toLocaleString()}
                              </Badge>
                            )}
                            {timeEstimate && (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {timeEstimate}d
                              </Badge>
                            )}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className={cn("px-5 py-5 border-t", colors.border, "bg-gradient-to-b from-muted/20 to-transparent")}>
                          <AnalysisContentRenderer content={content} phaseId={phase.id} />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CTA */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold mb-2">
                ¿Listo para comenzar tu negocio?
              </h3>
              <p className="text-muted-foreground">
                Continúa al dashboard para gestionar tu restaurante y seguir tu progreso
              </p>
            </div>
            <Button size="lg" onClick={onComplete} disabled={isCompleting} className="min-w-[200px]">
              {isCompleting ? (
                <>
                  <Rocket className="h-5 w-5 mr-2 animate-pulse" />
                  Creando...
                </>
              ) : (
                <>
                  Ir a mi Dashboard
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
