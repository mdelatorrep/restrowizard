import { Calendar } from 'lucide-react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LifecycleInfo } from '../existingBusinessHelpers';

interface Props {
  openingDate: string;
  lifecycleInfo: LifecycleInfo | null;
  onChange: (field: string, value: string) => void;
}

export function StepOpeningDate({ openingDate, lifecycleInfo, onChange }: Props) {
  return (
    <>
      <CardHeader className="text-center">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
          <Calendar className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-headline">¿Cuándo abriste tu restaurante?</CardTitle>
        <CardDescription className="font-lato-light">
          Esto nos ayuda a personalizar tu experiencia según tu etapa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="opening_date">Fecha de apertura *</Label>
          <Input
            id="opening_date"
            type="date"
            value={openingDate}
            onChange={(e) => onChange('opening_date', e.target.value)}
          />
        </div>

        {lifecycleInfo && (
          <div className="p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                {lifecycleInfo.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {lifecycleInfo.stage === 'pre_opening' && (
                <>Te faltan {lifecycleInfo.days} días para abrir. Te ayudaremos con la preparación.</>
              )}
              {lifecycleInfo.stage === 'first_90_days' && (
                <>Llevas {lifecycleInfo.days} días operando. Estás en la fase crítica de estabilización.</>
              )}
              {lifecycleInfo.stage === 'normal_operation' && (
                <>Tu restaurante lleva {Math.floor(lifecycleInfo.days / 30)} meses operando. Es hora de optimizar.</>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </>
  );
}
