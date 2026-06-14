import { formatCurrency } from '@/lib/formatCurrency';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Settings } from 'lucide-react';

interface Props {
  modifiers: any[];
}

export function MenuModifiersTab({ modifiers }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Modificadores y Extras</CardTitle>
        <CardDescription>
          Configura opciones adicionales como acompañamientos, tamaños, ingredientes extra, etc.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {modifiers.length === 0 ? (
          <div className="text-center py-8">
            <Settings className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No hay modificadores configurados aún.</p>
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Crear Primer Modificador
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {(modifiers || []).map((modifier) => (
              <Card key={modifier.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{modifier.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {modifier.type === 'single'
                          ? 'Selección única'
                          : modifier.type === 'multiple'
                          ? 'Selección múltiple'
                          : 'Requerido'}
                      </p>
                    </div>
                    <Badge variant="secondary">{modifier.options.length} opciones</Badge>
                  </div>
                  {modifier.options.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {modifier.options.map((option: any) => (
                        <Badge key={option.id} variant="outline">
                          {option.name}
                          {option.price_adjustment > 0 && (
                            <span className="ml-1 text-green-600">
                              +{formatCurrency(Number(option.price_adjustment))}
                            </span>
                          )}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
