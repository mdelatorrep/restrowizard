import { ArrowLeft, CheckCircle2, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  onGoToDashboard: () => void;
}

export function OnboardingCompleteScreen({ onGoToDashboard }: Props) {
  const items = [
    'Diagnóstico inicial de madurez',
    'Plan de acción con prioridades',
    'Benchmark contra la industria',
    'KPIs para medir tu progreso',
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mb-4">
            <PartyPopper className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">
            ¡Felicidades por tu nuevo restaurante!
          </CardTitle>
          <CardDescription className="text-base">
            Hemos creado tu línea base de madurez basada en cómo montaste tu negocio. Ahora tienes un plan
            de acción personalizado para mejorar continuamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 text-left">
            <h4 className="font-medium mb-2">Lo que preparamos para ti:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {items.map((label) => (
                <li key={label} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <Button size="lg" onClick={onGoToDashboard} className="w-full gap-2">
            Ir a mi Dashboard
            <ArrowLeft className="h-4 w-4 rotate-180" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
