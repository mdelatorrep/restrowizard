import { ArrowLeft, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OpeningProjectWizard } from '@/components/opening/OpeningProjectWizard';

interface Props {
  onBack: () => void;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

export function OnboardingCreateScreen({ onBack, onSubmit, isSubmitting }: Props) {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" onClick={onBack} className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-headline font-bold">Asistente de Apertura</h1>
              <p className="text-muted-foreground">Te guiaremos paso a paso en la apertura de tu negocio</p>
            </div>
          </div>
        </div>

        <OpeningProjectWizard onSubmit={onSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}
