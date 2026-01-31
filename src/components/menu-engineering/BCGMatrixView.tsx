import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMenuEngineeringData, MenuItemWithCosts } from '@/hooks/useMenuEngineeringData';
import { Star, DollarSign, TrendingUp, HelpCircle, X, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BCGMatrixProps {
  periodDays?: number;
}

const BCGCategoryIcon = ({ category }: { category: string }) => {
  switch (category) {
    case 'star':
      return <Star className="h-4 w-4 text-yellow-500" />;
    case 'cash_cow':
      return <DollarSign className="h-4 w-4 text-green-500" />;
    case 'question_mark':
      return <HelpCircle className="h-4 w-4 text-orange-500" />;
    case 'dog':
      return <X className="h-4 w-4 text-red-500" />;
    default:
      return null;
  }
};

const CategoryBadge = ({ category }: { category: string }) => {
  const config: Record<string, { label: string; className: string }> = {
    star: { label: 'Estrella', className: 'bg-yellow-100 text-yellow-800' },
    cash_cow: { label: 'Vaca', className: 'bg-green-100 text-green-800' },
    question_mark: { label: 'Incógnita', className: 'bg-orange-100 text-orange-800' },
    dog: { label: 'Perro', className: 'bg-red-100 text-red-800' },
    unknown: { label: 'Sin datos', className: 'bg-gray-100 text-gray-800' }
  };
  const cat = config[category] || config.unknown;
  return <Badge className={cat.className}>{cat.label}</Badge>;
};

const MenuItemCard: React.FC<{ 
  item: MenuItemWithCosts;
  recommendations: string[];
}> = ({ item, recommendations }) => (
  <div className="p-3 bg-muted/50 rounded-lg space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <BCGCategoryIcon category={item.bcg_category} />
        <span className="font-medium">{item.name}</span>
      </div>
      <CategoryBadge category={item.bcg_category} />
    </div>
    <div className="grid grid-cols-3 gap-2 text-sm">
      <div>
        <span className="text-muted-foreground">Precio:</span>
        <span className="ml-1 font-medium">${item.price.toFixed(2)}</span>
      </div>
      <div>
        <span className="text-muted-foreground">Costo:</span>
        <span className="ml-1 font-medium">${item.recipe_cost.toFixed(2)}</span>
      </div>
      <div>
        <span className="text-muted-foreground">Margen:</span>
        <span className={`ml-1 font-medium ${item.margin_percent >= 50 ? 'text-green-600' : 'text-red-600'}`}>
          {item.margin_percent.toFixed(1)}%
        </span>
      </div>
    </div>
    {item.sales_count !== undefined && item.sales_count > 0 && (
      <div className="text-xs text-muted-foreground">
        Vendidos: {item.sales_count} | Ingresos: ${(item.revenue || 0).toFixed(2)}
      </div>
    )}
    {!item.recipe_id && (
      <Badge variant="outline" className="text-xs text-orange-600">
        ⚠️ Sin receta vinculada
      </Badge>
    )}
    {recommendations.length > 0 && (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="cursor-help">
              {recommendations.length} recomendaciones
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <ul className="list-disc list-inside text-xs">
              {recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )}
  </div>
);

const QuadrantCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  items: MenuItemWithCosts[];
  getRecommendations: (item: MenuItemWithCosts) => string[];
  colorClass: string;
}> = ({ title, description, icon, items, getRecommendations, colorClass }) => (
  <Card className={`border-2 ${colorClass}`}>
    <CardHeader className="pb-2">
      <CardTitle className="flex items-center gap-2 text-lg">
        {icon}
        {title} ({items.length})
      </CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Sin productos en esta categoría
        </p>
      ) : (
        items.map(item => (
          <MenuItemCard 
            key={item.id} 
            item={item} 
            recommendations={getRecommendations(item)}
          />
        ))
      )}
    </CardContent>
  </Card>
);

export const BCGMatrixView: React.FC<BCGMatrixProps> = ({ periodDays = 30 }) => {
  const { 
    bcgMatrix, 
    insights, 
    loading, 
    hasData, 
    getRecommendations 
  } = useMenuEngineeringData(periodDays);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasData) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <TrendingUp className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Sin datos de ventas</h3>
          <p className="text-muted-foreground text-center">
            Registra ventas desde el POS para ver el análisis de ingeniería de menú
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      {insights && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{insights.totalItems}</p>
              <p className="text-sm text-muted-foreground">Productos Totales</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{insights.avgMargin.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Margen Promedio</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-green-600">{insights.itemsWithRecipes}</p>
              <p className="text-sm text-muted-foreground">Con Receta</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-orange-600">{insights.itemsWithoutRecipes}</p>
              <p className="text-sm text-muted-foreground">Sin Receta</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* BCG Matrix Grid */}
      {bcgMatrix && (
        <div className="grid md:grid-cols-2 gap-4">
          <QuadrantCard
            title="Estrellas"
            description="Alta popularidad + Alta rentabilidad. Mantener y promocionar."
            icon={<Star className="h-5 w-5 text-yellow-500" />}
            items={bcgMatrix.stars}
            getRecommendations={getRecommendations}
            colorClass="border-yellow-300"
          />
          <QuadrantCard
            title="Vacas Lecheras"
            description="Baja popularidad + Alta rentabilidad. Aumentar visibilidad."
            icon={<DollarSign className="h-5 w-5 text-green-500" />}
            items={bcgMatrix.cashCows}
            getRecommendations={getRecommendations}
            colorClass="border-green-300"
          />
          <QuadrantCard
            title="Incógnitas"
            description="Alta popularidad + Baja rentabilidad. Revisar costos o precios."
            icon={<HelpCircle className="h-5 w-5 text-orange-500" />}
            items={bcgMatrix.questionMarks}
            getRecommendations={getRecommendations}
            colorClass="border-orange-300"
          />
          <QuadrantCard
            title="Perros"
            description="Baja popularidad + Baja rentabilidad. Considerar eliminar."
            icon={<X className="h-5 w-5 text-red-500" />}
            items={bcgMatrix.dogs}
            getRecommendations={getRecommendations}
            colorClass="border-red-300"
          />
        </div>
      )}

      {/* Low Margin Alerts */}
      {insights && insights.lowMarginAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">⚠️ Alertas de Margen Bajo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.lowMarginAlerts.slice(0, 5).map(item => (
                <div key={item.id} className="flex justify-between items-center p-2 bg-white rounded">
                  <span>{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 font-medium">
                      {item.margin_percent.toFixed(1)}% margen
                    </span>
                    <Badge variant="outline">Revisar precio</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
