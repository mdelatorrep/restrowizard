import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PartyPopper, 
  Sparkles, 
  TrendingUp, 
  Building2,
  ChefHat,
  Users,
  DollarSign,
  Target,
  ArrowRight
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Confetti from '@/components/ui/confetti';

interface StageTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromStage: 'first_90_days';
  toStage: 'normal_operation';
  metrics?: {
    totalRevenue?: number;
    customersServed?: number;
    avgRating?: number;
    teamSize?: number;
  };
}

export const StageTransitionModal: React.FC<StageTransitionModalProps> = ({
  isOpen,
  onClose,
  metrics = {},
}) => {
  const navigate = useNavigate();

  const handleContinue = () => {
    onClose();
    navigate('/r/dashboard');
  };

  const achievements = [
    { 
      icon: DollarSign, 
      label: 'Ingresos Generados', 
      value: metrics.totalRevenue 
        ? `$${(metrics.totalRevenue / 1000).toFixed(0)}k` 
        : 'N/A',
      color: 'text-green-500'
    },
    { 
      icon: Users, 
      label: 'Clientes Atendidos', 
      value: metrics.customersServed?.toLocaleString() || 'N/A',
      color: 'text-blue-500'
    },
    { 
      icon: Target, 
      label: 'Calificación Promedio', 
      value: metrics.avgRating ? `${metrics.avgRating}/5 ⭐` : 'N/A',
      color: 'text-amber-500'
    },
    { 
      icon: ChefHat, 
      label: 'Equipo Actual', 
      value: metrics.teamSize ? `${metrics.teamSize} personas` : 'N/A',
      color: 'text-purple-500'
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {isOpen && <Confetti />}
        
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 p-4 rounded-full bg-gradient-to-br from-primary/20 to-success/20">
            <PartyPopper className="h-10 w-10 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-headline flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            ¡Felicidades!
            <Sparkles className="h-5 w-5 text-amber-500" />
          </DialogTitle>
          <DialogDescription className="text-base">
            Has completado tus primeros 90 días de operación. 
            ¡Tu restaurante ahora entra en fase de operación normal!
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Stage transition visual */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex flex-col items-center">
              <div className="p-2 rounded-lg bg-purple-500/20 mb-1">
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
              <span className="text-xs text-muted-foreground">90 Días</span>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <div className="flex flex-col items-center">
              <div className="p-2 rounded-lg bg-primary/20 mb-1">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Operación</span>
            </div>
          </div>

          {/* Achievements */}
          <div className="grid grid-cols-2 gap-3">
            {achievements.map((achievement, index) => (
              <div 
                key={index}
                className="p-3 rounded-lg border bg-muted/30 text-center"
              >
                <achievement.icon className={`h-5 w-5 mx-auto mb-1 ${achievement.color}`} />
                <p className="text-lg font-bold">{achievement.value}</p>
                <p className="text-xs text-muted-foreground">{achievement.label}</p>
              </div>
            ))}
          </div>

          {/* Next steps */}
          <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              ¿Qué sigue?
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Acceso a módulos avanzados: Ghost Kitchen, Cadenas</li>
              <li>• Análisis de sostenibilidad y optimización continua</li>
              <li>• Benchmarking contra la industria</li>
              <li>• Planificación de expansión</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleContinue} className="w-full gap-2">
            Continuar al Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StageTransitionModal;
