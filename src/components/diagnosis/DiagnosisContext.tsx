import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import type { RestaurantContext } from '@/hooks/useDiagnosis';

interface Props {
  context: RestaurantContext;
  onChange: (updater: (prev: RestaurantContext) => RestaurantContext) => void;
  onSkip: () => void;
  onContinue: () => void;
}

export const DiagnosisContext = ({ context, onChange, onSkip, onContinue }: Props) => (
  <div className="min-h-screen bg-card p-4 md:p-8">
    <div className="container mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Sparkles className="h-5 w-5 text-primary" />
            Cuéntanos sobre tu restaurante
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Esta información nos ayuda a darte recomendaciones más precisas (opcional)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-lato-medium text-foreground">Tipo de negocio</label>
            <select
              className="w-full mt-1 p-3 border rounded-lg bg-background"
              value={context.businessType || ''}
              onChange={(e) => onChange(prev => ({ ...prev, businessType: e.target.value }))}
            >
              <option value="">Selecciona...</option>
              <option value="fast_casual">Fast Casual</option>
              <option value="fine_dining">Fine Dining</option>
              <option value="casual_dining">Casual Dining</option>
              <option value="quick_service">Quick Service (QSR)</option>
              <option value="cafeteria">Cafetería</option>
              <option value="bar_restaurant">Bar/Restaurante</option>
              <option value="food_truck">Food Truck</option>
              <option value="dark_kitchen">Dark Kitchen</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-lato-medium text-foreground">Ubicación</label>
            <input
              type="text"
              placeholder="Ciudad, País"
              className="w-full mt-1 p-3 border rounded-lg bg-background"
              value={context.location || ''}
              onChange={(e) => onChange(prev => ({ ...prev, location: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-lato-medium text-foreground">Empleados</label>
              <input
                type="number"
                placeholder="Ej: 15"
                className="w-full mt-1 p-3 border rounded-lg bg-background"
                value={context.employeeCount || ''}
                onChange={(e) => onChange(prev => ({ ...prev, employeeCount: parseInt(e.target.value) || undefined }))}
              />
            </div>
            <div>
              <label className="text-sm font-lato-medium text-foreground">Ticket promedio ($)</label>
              <input
                type="number"
                placeholder="Ej: 25"
                className="w-full mt-1 p-3 border rounded-lg bg-background"
                value={context.averageTicket || ''}
                onChange={(e) => onChange(prev => ({ ...prev, averageTicket: parseInt(e.target.value) || undefined }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-lato-medium text-foreground">Años operando</label>
              <input
                type="number"
                placeholder="Ej: 3"
                className="w-full mt-1 p-3 border rounded-lg bg-background"
                value={context.yearsOperating || ''}
                onChange={(e) => onChange(prev => ({ ...prev, yearsOperating: parseInt(e.target.value) || undefined }))}
              />
            </div>
            <div>
              <label className="text-sm font-lato-medium text-foreground">Capacidad (asientos)</label>
              <input
                type="number"
                placeholder="Ej: 50"
                className="w-full mt-1 p-3 border rounded-lg bg-background"
                value={context.seatingCapacity || ''}
                onChange={(e) => onChange(prev => ({ ...prev, seatingCapacity: parseInt(e.target.value) || undefined }))}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-lato-medium text-foreground">Tipo de cocina</label>
            <input
              type="text"
              placeholder="Ej: Mexicana, Italiana, Fusión..."
              className="w-full mt-1 p-3 border rounded-lg bg-background"
              value={context.cuisineType || ''}
              onChange={(e) => onChange(prev => ({ ...prev, cuisineType: e.target.value }))}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onSkip} className="flex-1">Omitir</Button>
            <Button onClick={onContinue} className="flex-1">
              Continuar <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);
