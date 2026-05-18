import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Sparkles, PartyPopper, ClipboardCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';

interface Props {
  businessName: string;
  openingDate: string;
  daysUntilOpening: number;
  countdown: { days: number; hours: number; minutes: number };
  hasAIChecklist: boolean;
  isConfirmingOpening: boolean;
  onConfirmOpening: () => void;
}

export const PreOpeningHero: React.FC<Props> = ({
  businessName, openingDate, daysUntilOpening, countdown,
  hasAIChecklist, isConfirmingOpening, onConfirmOpening,
}) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-background to-success/10 border-primary/20 overflow-hidden relative">
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
        <Sparkles className="h-5 w-5 sm:h-8 sm:w-8 text-primary/30 animate-pulse" />
      </div>
      <CardHeader className="text-center pb-1 sm:pb-2 px-3 sm:px-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Rocket className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
          <Badge variant="outline" className="text-primary border-primary text-xs sm:text-sm">Pre-Apertura</Badge>
        </div>
        <CardTitle className="text-xl sm:text-2xl md:text-4xl font-headline text-primary leading-tight">
          {businessName}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm md:text-lg">
          Apertura programada: {format(parseISO(openingDate), "EEEE d 'de' MMMM, yyyy", { locale: es })}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        <div className="flex justify-center gap-2 sm:gap-4 md:gap-8 my-4 sm:my-6 md:my-8">
          {[
            { v: countdown.days, l: 'días' },
            { v: countdown.hours, l: 'horas' },
            { v: countdown.minutes, l: 'minutos' },
          ].map((u, i) => (
            <React.Fragment key={u.l}>
              {i > 0 && <div className="text-2xl sm:text-4xl md:text-6xl font-bold text-muted-foreground">:</div>}
              <div className="text-center">
                <div className="text-2xl sm:text-4xl md:text-6xl font-bold text-primary">{u.v}</div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">{u.l}</div>
              </div>
            </React.Fragment>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
          {daysUntilOpening <= 0 ? (
            <Button
              size={isMobile ? 'default' : 'lg'}
              onClick={onConfirmOpening}
              disabled={isConfirmingOpening}
              className="gap-2 bg-success hover:bg-success/90 text-sm sm:text-base"
            >
              <PartyPopper className="h-4 w-4 sm:h-5 sm:w-5" />
              {isConfirmingOpening ? 'Confirmando...' : '¡Confirmar Apertura Oficial!'}
            </Button>
          ) : (
            <>
              <Button
                size={isMobile ? 'default' : 'lg'}
                variant="outline"
                onClick={() => navigate('/r/new-business')}
                className="gap-2 text-xs sm:text-sm"
              >
                <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Revisar Plan de Apertura</span>
                <span className="sm:hidden">Ver Plan</span>
              </Button>
              {!hasAIChecklist && (
                <Button
                  size={isMobile ? 'default' : 'lg'}
                  onClick={() => navigate('/r/new-business')}
                  className="gap-2 text-xs sm:text-sm"
                >
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Generar Checklist con IA</span>
                  <span className="sm:hidden">Checklist IA</span>
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
