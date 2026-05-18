import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Phone, MapPin, Clock, Mail, ExternalLink, Package, Building2, Leaf, Copy, TrendingDown,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SupplierAlternative } from '@/hooks/useSupplierAnalysis';

const SupplierTypeIcon: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'central_abastos': return <Building2 className="h-4 w-4" />;
    case 'mayorista': return <Package className="h-4 w-4" />;
    case 'distribuidor': return <ExternalLink className="h-4 w-4" />;
    case 'productor': return <Leaf className="h-4 w-4" />;
    default: return <Building2 className="h-4 w-4" />;
  }
};

const ConfidenceBadge: React.FC<{ confidence: string }> = ({ confidence }) => {
  const variants: Record<string, { variant: 'default' | 'secondary' | 'outline'; label: string }> = {
    high: { variant: 'default', label: 'Alta confianza' },
    medium: { variant: 'secondary', label: 'Confianza media' },
    low: { variant: 'outline', label: 'Baja confianza' },
  };
  const config = variants[confidence] || variants.low;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export const SupplierCard: React.FC<{ supplier: SupplierAlternative; currentCost: number | null }> = ({
  supplier, currentCost,
}) => {
  const { toast } = useToast();
  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copiado', description: `${label} copiado al portapapeles` });
  };
  const savings = supplier.savings_percent > 0 ? supplier.savings_percent : null;
  const estimatedSavings = savings && currentCost ? (currentCost * savings / 100).toFixed(2) : null;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10"><SupplierTypeIcon type={supplier.type} /></div>
            <div>
              <CardTitle className="text-base font-medium">{supplier.name}</CardTitle>
              <CardDescription className="text-xs capitalize">{supplier.type.replace('_', ' ')}</CardDescription>
            </div>
          </div>
          <ConfidenceBadge confidence={supplier.confidence} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <p className="text-sm text-muted-foreground">Precio estimado</p>
            <p className="text-xl font-bold">
              {supplier.estimated_price ? `$${supplier.estimated_price.toFixed(2)}/${supplier.unit}` : 'No disponible'}
            </p>
          </div>
          {savings && savings > 0 && (
            <div className="text-right">
              <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                <TrendingDown className="h-3 w-3 mr-1" />
                {savings.toFixed(0)}% ahorro
              </Badge>
              {estimatedSavings && (
                <p className="text-xs text-muted-foreground mt-1">~${estimatedSavings}/{supplier.unit}</p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          {supplier.contact.phone && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" /><span>{supplier.contact.phone}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => copy(supplier.contact.phone!, 'Teléfono')}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          {supplier.contact.address && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /><span className="line-clamp-1">{supplier.contact.address}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => copy(supplier.contact.address!, 'Dirección')}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          {supplier.contact.hours && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /><span>{supplier.contact.hours}</span>
            </div>
          )}
          {supplier.contact.email && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" /><span>{supplier.contact.email}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => copy(supplier.contact.email!, 'Email')}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {supplier.notes && (
          <p className="text-xs text-muted-foreground italic border-t pt-2">{supplier.notes}</p>
        )}
      </CardContent>
    </Card>
  );
};
