import { Button } from '@/components/ui/button';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Download, Loader2, Pencil, RefreshCcw, RotateCw, CheckCircle2 } from 'lucide-react';
import { OpeningPlanPDF } from './OpeningPlanPDF';
import type { BusinessProject, PhaseAnalysis, ChecklistItem } from '@/hooks/useBusinessProject';
import type { ProjectMetrics } from './openingResultsHelpers';

interface Props {
  project: BusinessProject;
  analyses: PhaseAnalysis[];
  checklist: ChecklistItem[];
  metrics: ProjectMetrics;
  onEdit?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  needsRegeneration?: boolean;
  onRegenerateAll?: () => void;
  isRegenerating?: boolean;
}

export const OpeningResultsHeader: React.FC<Props> = ({
  project, analyses, checklist, metrics,
  onEdit, onRefresh, isRefreshing, needsRegeneration, onRegenerateAll, isRegenerating,
}) => (
  <div className="relative text-center py-8 bg-gradient-to-b from-primary/5 to-transparent rounded-xl">
    <div className="absolute right-4 top-4 flex gap-2">
      <PDFDownloadLink
        document={<OpeningPlanPDF project={project} analyses={analyses} checklist={checklist} metrics={metrics} />}
        fileName={`Plan-Apertura-${project.project_name.replace(/\s+/g, '-')}.pdf`}
      >
        {({ loading }) => (
          <Button variant="outline" size="sm" disabled={loading} className="gap-2">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Generando...</> : <><Download className="h-4 w-4" />Descargar PDF</>}
          </Button>
        )}
      </PDFDownloadLink>
      {onEdit && (
        <Button variant="outline" size="sm" onClick={onEdit} className="gap-2">
          <Pencil className="h-4 w-4" />Editar
        </Button>
      )}
      {onRefresh && (
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={!!isRefreshing} className="gap-2">
          {isRefreshing ? <><Loader2 className="h-4 w-4 animate-spin" />Recargando…</> : <><RefreshCcw className="h-4 w-4" />Recargar</>}
        </Button>
      )}
    </div>
    <div className="inline-flex items-center justify-center p-4 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
      <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
    </div>
    <h1 className="text-3xl font-bold mb-2">¡Tu Plan de Apertura está Listo!</h1>
    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
      Hemos analizado todos los aspectos de tu proyecto <strong>{project.project_name}</strong> y
      generado un plan personalizado para {project.city}, {project.country}.
    </p>
    {needsRegeneration && onRegenerateAll && (
      <div className="mt-4 inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-4 py-2 rounded-lg">
        <RotateCw className="h-4 w-4" />
        <span className="text-sm font-medium">Has editado los datos del proyecto.</span>
        <Button size="sm" variant="outline" onClick={onRegenerateAll} disabled={isRegenerating}
          className="ml-2 bg-amber-200 dark:bg-amber-800 border-amber-300 dark:border-amber-700">
          {isRegenerating ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Regenerando…</> : 'Regenerar Plan'}
        </Button>
      </div>
    )}
  </div>
);
