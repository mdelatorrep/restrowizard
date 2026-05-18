import { ArrowLeft, AlertTriangle, Loader2, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  onBack: () => void;
  analysesErrorMsg: string | null;
  checklistErrorMsg: string | null;
  onRetry: () => void;
  isRefreshing: boolean;
}

export function OnboardingResultsError({
  onBack,
  analysesErrorMsg,
  checklistErrorMsg,
  onRetry,
  isRefreshing,
}: Props) {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <CardTitle>No se pudo cargar tu plan</CardTitle>
            </div>
            <CardDescription>
              Se generaron acciones, pero la app no puede leer el análisis/checklist. Esto suele ser permisos (RLS) o sesión.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysesErrorMsg && (
              <div className="text-sm">
                <p className="font-medium">Error cargando análisis:</p>
                <p className="text-muted-foreground break-words">{analysesErrorMsg}</p>
              </div>
            )}
            {checklistErrorMsg && (
              <div className="text-sm">
                <p className="font-medium">Error cargando checklist:</p>
                <p className="text-muted-foreground break-words">{checklistErrorMsg}</p>
              </div>
            )}

            <Button variant="outline" className="w-full" onClick={onRetry} disabled={isRefreshing}>
              {isRefreshing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Reintentando…
                </>
              ) : (
                <>
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Reintentar carga
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
