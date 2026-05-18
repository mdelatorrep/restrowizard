import { Brain, Target, BarChart3, Sparkles, Loader2 } from 'lucide-react';

type AIStep = 'analyzing' | 'plan' | 'benchmark' | 'done';

const steps = [
  { id: 'analyzing', label: 'Analizando respuestas...', icon: Brain },
  { id: 'plan', label: 'Generando plan de acción...', icon: Target },
  { id: 'benchmark', label: 'Comparando con la industria...', icon: BarChart3 },
  { id: 'done', label: '¡Listo!', icon: Sparkles },
];

export const DiagnosisLoading = ({ aiStep }: { aiStep: AIStep }) => (
  <div className="min-h-screen bg-card flex items-center justify-center p-4 md:p-8">
    <div className="container mx-auto max-w-4xl">
      <div className="text-center bg-background p-12 rounded-2xl shadow-xl">
        <div className="text-6xl text-secondary mb-6 animate-pulse">🧙‍♂️</div>
        <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-4">
          Nuestra IA está trabajando...
        </h2>

        <div className="max-w-md mx-auto mt-8 space-y-4">
          {steps.map((step, index) => {
            const stepIndex = steps.findIndex(s => s.id === aiStep);
            const isCompleted = index < stepIndex;
            const isCurrent = step.id === aiStep;
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  isCompleted ? 'bg-success/10' : isCurrent ? 'bg-primary/10' : 'bg-muted/30'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isCompleted ? 'bg-success text-white' : isCurrent ? 'bg-primary text-white' : 'bg-muted'
                }`}>
                  {isCurrent ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className={`font-lato-medium ${
                  isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </div>
);
