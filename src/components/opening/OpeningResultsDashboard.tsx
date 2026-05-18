import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Rocket, ListChecks, FileText, ArrowRight, Sparkles } from 'lucide-react';
import { BusinessProject, PhaseAnalysis, ChecklistItem } from '@/hooks/useBusinessProject';
import { EditProjectDetailsDialog } from './EditProjectDetailsDialog';
import { formatCurrencyByCountry, getCurrencySymbol, getCurrencyCode } from '@/data/constants';
import { OpeningResultsHeader } from './OpeningResultsHeader';
import { OpeningKeyMetrics } from './OpeningKeyMetrics';
import { OpeningUrgentActions } from './OpeningUrgentActions';
import { OpeningPhaseSummaryGrid } from './OpeningPhaseSummaryGrid';
import { OpeningChecklistTab } from './OpeningChecklistTab';
import { OpeningDetailsTab } from './OpeningDetailsTab';
import {
  CHECKLIST_PHASE_ORDER, calculateMetrics, groupChecklistByPhase,
} from './openingResultsHelpers';

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

export function OpeningResultsDashboard({
  project, analyses, checklist, onToggleChecklistItem,
  onGenerateChecklist, isGeneratingChecklist, onRefreshData, isRefreshing,
  onComplete, isCompleting, onUpdateProject, onRegenerateAll, isRegenerating, needsRegeneration,
}: OpeningResultsDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const metrics = useMemo(() => calculateMetrics(project, analyses), [analyses, project.estimated_budget]);

  const groupedChecklist = useMemo(() => groupChecklistByPhase(checklist), [checklist]);
  const orderedChecklistPhases = useMemo(
    () => CHECKLIST_PHASE_ORDER.filter((p) => groupedChecklist[p]?.length > 0),
    [groupedChecklist]
  );
  const checklistProgress = useMemo(() => {
    if (checklist.length === 0) return 0;
    return (checklist.filter((i) => i.is_completed).length / checklist.length) * 100;
  }, [checklist]);
  const urgentItems = useMemo(() => checklist.filter((i) => !i.is_completed).slice(0, 5), [checklist]);

  const daysUntilOpening = useMemo(() => {
    if (!project.target_opening_date) return null;
    const target = new Date(project.target_opening_date);
    const diffTime = target.getTime() - new Date().getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [project.target_opening_date]);

  const formatCurrency = (v: number) => formatCurrencyByCountry(v, project.country);
  const currencySymbol = getCurrencySymbol(project.country);
  const currencyCode = getCurrencyCode(project.country);

  const investmentLabel = metrics.totalInvestment > 0 ? formatCurrency(metrics.totalInvestment) : 'Por definir';
  const roiLabel = metrics.totalInvestment > 0 ? `${metrics.roi.toFixed(0)}%` : '—';

  return (
    <div className="space-y-6">
      {onUpdateProject && (
        <EditProjectDetailsDialog
          project={project}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={onUpdateProject}
        />
      )}

      <OpeningResultsHeader
        project={project}
        analyses={analyses}
        checklist={checklist}
        metrics={metrics}
        onEdit={onUpdateProject ? () => setIsEditDialogOpen(true) : undefined}
        onRefresh={onRefreshData ? () => void onRefreshData() : undefined}
        isRefreshing={isRefreshing}
        needsRegeneration={needsRegeneration}
        onRegenerateAll={onRegenerateAll ? () => void onRegenerateAll() : undefined}
        isRegenerating={isRegenerating}
      />

      <OpeningKeyMetrics
        investmentLabel={investmentLabel}
        currencyCode={currencyCode}
        roiLabel={roiLabel}
        metrics={metrics}
        daysUntilOpening={daysUntilOpening}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />Resumen
          </TabsTrigger>
          <TabsTrigger value="checklist" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Checklist ({checklist.filter((c) => c.is_completed).length}/{checklist.length})
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />Análisis Detallado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <OpeningUrgentActions
            urgentItems={urgentItems}
            onToggleChecklistItem={onToggleChecklistItem}
            onGenerateChecklist={onGenerateChecklist}
            isGeneratingChecklist={isGeneratingChecklist}
          />
          <OpeningPhaseSummaryGrid
            analyses={analyses}
            currencySymbol={currencySymbol}
            onSelectPhase={() => setActiveTab('details')}
          />
        </TabsContent>

        <TabsContent value="checklist" className="mt-6">
          <OpeningChecklistTab
            checklist={checklist}
            checklistProgress={checklistProgress}
            groupedChecklist={groupedChecklist}
            orderedChecklistPhases={orderedChecklistPhases}
            onToggleChecklistItem={onToggleChecklistItem}
            onGenerateChecklist={onGenerateChecklist}
            isGeneratingChecklist={isGeneratingChecklist}
          />
        </TabsContent>

        <TabsContent value="details" className="mt-6">
          <OpeningDetailsTab analyses={analyses} currencySymbol={currencySymbol} />
        </TabsContent>
      </Tabs>

      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold mb-2">¿Listo para comenzar tu negocio?</h3>
              <p className="text-muted-foreground">
                Continúa al dashboard para gestionar tu restaurante y seguir tu progreso
              </p>
            </div>
            <Button size="lg" onClick={onComplete} disabled={isCompleting} className="min-w-[200px]">
              {isCompleting ? (
                <><Rocket className="h-5 w-5 mr-2 animate-pulse" />Creando...</>
              ) : (
                <>Ir a mi Dashboard<ArrowRight className="h-5 w-5 ml-2" /></>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
