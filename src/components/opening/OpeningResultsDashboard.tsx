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
  AlertTriangle, Sparkles, ArrowRight
} from 'lucide-react';
import { BusinessProject, PhaseAnalysis, ChecklistItem } from '@/hooks/useBusinessProject';
import { PHASES, PhaseId } from '@/hooks/useBusinessOpening';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface OpeningResultsDashboardProps {
  project: BusinessProject;
  analyses: PhaseAnalysis[];
  checklist: ChecklistItem[];
  onToggleChecklistItem: (itemId: string, isCompleted: boolean) => void;
  onComplete: () => void;
  isCompleting?: boolean;
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
  onComplete,
  isCompleting,
}: OpeningResultsDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate metrics from analyses
  const metrics = useMemo(() => {
    let totalInvestment = 0;
    let monthlyOperatingCost = 0;
    let estimatedRevenue = 0;
    let breakEvenMonths = 0;

    analyses.forEach(analysis => {
      if (analysis.estimated_cost) {
        if (analysis.phase === 'financial_projection') {
          // Financial projections might have different structure
          totalInvestment += analysis.estimated_cost * 0.4;
          monthlyOperatingCost += analysis.estimated_cost * 0.1;
          estimatedRevenue += analysis.estimated_cost * 0.15;
        } else {
          totalInvestment += analysis.estimated_cost;
        }
      }
    });

    // Estimate break-even (simplified calculation)
    if (estimatedRevenue > monthlyOperatingCost && monthlyOperatingCost > 0) {
      breakEvenMonths = Math.ceil(totalInvestment / (estimatedRevenue - monthlyOperatingCost));
    } else {
      breakEvenMonths = 12; // Default estimate
    }

    return {
      totalInvestment,
      monthlyOperatingCost: monthlyOperatingCost || totalInvestment * 0.08,
      estimatedRevenue: estimatedRevenue || totalInvestment * 0.12,
      breakEvenMonths: Math.min(breakEvenMonths, 24),
      roi: estimatedRevenue > 0 ? ((estimatedRevenue - monthlyOperatingCost) / totalInvestment * 12 * 100) : 25,
    };
  }, [analyses]);

  // Group checklist by phase
  const groupedChecklist = useMemo(() => {
    const groups: Record<string, ChecklistItem[]> = {};
    checklist.forEach(item => {
      const phase = item.phase || 'general';
      if (!groups[phase]) groups[phase] = [];
      groups[phase].push(item);
    });
    return groups;
  }, [checklist]);

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Extract text content from analysis_data
  const getAnalysisContent = (analysis: PhaseAnalysis): string => {
    if (typeof analysis.analysis_data === 'string') {
      return analysis.analysis_data;
    }
    if (analysis.analysis_data?.text) {
      return analysis.analysis_data.text;
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
    return [];
  };

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center py-8 bg-gradient-to-b from-primary/5 to-transparent rounded-xl">
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
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inversión Estimada</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.totalInvestment)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ROI Anual Estimado</p>
                <p className="text-2xl font-bold">{metrics.roi.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Punto de Equilibrio</p>
                <p className="text-2xl font-bold">{metrics.breakEvenMonths} meses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Días hasta Apertura</p>
                <p className="text-2xl font-bold">
                  {daysUntilOpening !== null ? `${daysUntilOpening} días` : 'Por definir'}
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
            </CardContent>
          </Card>

          {/* Phase Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {PHASES.map(phase => {
              const analysis = analyses.find(a => a.phase === phase.id);
              const Icon = PHASE_ICONS[phase.id];
              
              if (!analysis) return null;

              const recommendations = getRecommendations(analysis);

              return (
                <Card key={phase.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">{phase.name}</CardTitle>
                        {analysis.estimated_cost && (
                          <Badge variant="secondary" className="mt-1">
                            {formatCurrency(analysis.estimated_cost)}
                          </Badge>
                        )}
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {recommendations.length > 0 ? (
                      <ul className="space-y-1.5">
                        {recommendations.slice(0, 3).map((rec, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Análisis completado. Ver detalles en la pestaña "Análisis Detallado".
                      </p>
                    )}
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
              <ScrollArea className="h-[500px] pr-4">
                <Accordion type="multiple" className="space-y-2">
                  {Object.entries(groupedChecklist).map(([phase, items]) => {
                    const phaseInfo = PHASES.find(p => p.id === phase);
                    const completedInPhase = items.filter(i => i.is_completed).length;
                    const Icon = PHASE_ICONS[phase as PhaseId] || ListChecks;

                    return (
                      <AccordionItem
                        key={phase}
                        value={phase}
                        className="border rounded-lg px-4"
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5 text-primary" />
                            <span className="font-medium">
                              {phaseInfo?.name || 'General'}
                            </span>
                            <Badge variant="secondary">
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="space-y-2">
                {PHASES.map(phase => {
                  const analysis = analyses.find(a => a.phase === phase.id);
                  const Icon = PHASE_ICONS[phase.id];
                  
                  if (!analysis) return null;

                  return (
                    <AccordionItem
                      key={phase.id}
                      value={phase.id}
                      className="border rounded-lg px-4"
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium">{phase.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {PHASE_DESCRIPTIONS[phase.id]}
                            </p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pt-4 prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {getAnalysisContent(analysis)}
                          </ReactMarkdown>
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
