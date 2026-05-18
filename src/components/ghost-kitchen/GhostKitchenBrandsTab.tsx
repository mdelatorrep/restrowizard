import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pause, Play, Plus, Clock } from 'lucide-react';
import type { DisplayBrand } from './ghostKitchenHelpers';

interface Props {
  displayBrands: DisplayBrand[];
  onNewBrand: () => void;
}

export const GhostKitchenBrandsTab: React.FC<Props> = ({ displayBrands, onNewBrand }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {displayBrands.map((brand) => (
      <Card key={brand.id} className={brand.status === 'paused' ? 'opacity-60' : ''}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{brand.logo}</span>
              <div>
                <CardTitle className="text-lg">{brand.name}</CardTitle>
                <Badge variant={brand.status === 'active' ? 'default' : 'secondary'}>
                  {brand.status === 'active' ? 'Activa' : 'Pausada'}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              {brand.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Órdenes Hoy</p>
              <p className="text-xl font-bold">{brand.orders_today}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ingresos</p>
              <p className="text-xl font-bold">${brand.revenue_today.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{brand.avg_prep_time} min prep</span>
            <span className="flex items-center gap-1">⭐ {brand.rating}</span>
          </div>
        </CardContent>
      </Card>
    ))}
    <Card className="border-dashed flex items-center justify-center min-h-[250px] cursor-pointer hover:bg-muted/50 transition-colors" onClick={onNewBrand}>
      <div className="text-center">
        <Plus className="h-12 w-12 mx-auto text-muted-foreground" />
        <p className="mt-2 font-medium">Agregar Nueva Marca</p>
        <p className="text-sm text-muted-foreground">Crea una marca virtual</p>
      </div>
    </Card>
  </div>
);
