import React from 'react';
import { PlayCircle, PlusCircle, ArrowRight, Clock, MapPin, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ExistingProject {
  id: string;
  project_name: string;
  progress_percentage: number;
  city: string;
  country: string;
  target_opening_date: string | null;
  current_phase: string | null;
  updated_at: string;
}

interface ResumeOrNewSelectorProps {
  existingProject: ExistingProject;
  onResume: () => void;
  onStartNew: () => void;
  onBack: () => void;
}

export const ResumeOrNewSelector: React.FC<ResumeOrNewSelectorProps> = ({
  existingProject,
  onResume,
  onStartNew,
  onBack,
}) => {
  const progress = existingProject.progress_percentage ?? 0;
  const isComplete = progress >= 100;

  const formatPhase = (phase: string | null) => {
    if (!phase) return 'Iniciando';
    const phaseNames: Record<string, string> = {
      legal_requirements: 'Requisitos Legales',
      location_analysis: 'Análisis de Ubicación',
      equipment_setup: 'Equipamiento',
      supplier_network: 'Proveedores',
      staffing_plan: 'Personal',
      marketing_launch: 'Marketing',
      financial_projection: 'Proyecciones Financieras',
      completed: 'Completado',
    };
    return phaseNames[phase] || phase;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-headline font-bold text-primary mb-2">
            Tienes un proyecto en curso
          </h1>
          <p className="text-muted-foreground font-lato-light">
            ¿Deseas continuar con tu proyecto existente o empezar uno nuevo?
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {/* Existing Project Card */}
          <Card
            className="cursor-pointer transition-all duration-300 hover:shadow-elegant hover:border-primary/50 group"
            onClick={onResume}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary transition-colors">
                    <PlayCircle className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{existingProject.project_name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {existingProject.city}, {existingProject.country}
                    </CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progreso</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {isComplete ? 'Análisis completo' : `Fase actual: ${formatPhase(existingProject.current_phase)}`}
                  </span>
                </div>
                {existingProject.target_opening_date && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {format(new Date(existingProject.target_opening_date), 'dd MMM yyyy', { locale: es })}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Button className="w-full gap-2">
                  <PlayCircle className="h-4 w-4" />
                  {isComplete ? 'Ver resultados' : 'Continuar proyecto'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Start New Card */}
          <Card
            className="cursor-pointer transition-all duration-300 hover:shadow-elegant hover:border-info/50 group"
            onClick={onStartNew}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-info/10 rounded-xl flex items-center justify-center group-hover:bg-info transition-colors">
                    <PlusCircle className="h-6 w-6 text-info group-hover:text-info-foreground transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Empezar un proyecto nuevo</h3>
                    <p className="text-sm text-muted-foreground">
                      Crear un nuevo plan de apertura desde cero
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-info transition-colors" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button variant="ghost" onClick={onBack}>
            Volver atrás
          </Button>
        </div>
      </div>
    </div>
  );
};

