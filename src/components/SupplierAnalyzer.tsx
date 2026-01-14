import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  TrendingDown, 
  Phone, 
  MapPin, 
  Clock, 
  Mail, 
  ExternalLink,
  Loader2,
  Package,
  DollarSign,
  Building2,
  Leaf,
  AlertCircle,
  CheckCircle,
  History,
  Trash2,
  Copy
} from 'lucide-react';
import { useSupplierAnalysis, SupplierAlternative, SupplierAnalysisResult } from '@/hooks/useSupplierAnalysis';
import { useInventoryData } from '@/hooks/useInventoryData';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const SupplierTypeIcon: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'central_abastos':
      return <Building2 className="h-4 w-4" />;
    case 'mayorista':
      return <Package className="h-4 w-4" />;
    case 'distribuidor':
      return <ExternalLink className="h-4 w-4" />;
    case 'productor':
      return <Leaf className="h-4 w-4" />;
    default:
      return <Building2 className="h-4 w-4" />;
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

const SupplierCard: React.FC<{ 
  supplier: SupplierAlternative; 
  currentCost: number | null;
}> = ({ supplier, currentCost }) => {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: `${label} copiado al portapapeles`,
    });
  };

  const savings = supplier.savings_percent > 0 ? supplier.savings_percent : null;
  const estimatedSavings = savings && currentCost 
    ? (currentCost * savings / 100).toFixed(2) 
    : null;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <SupplierTypeIcon type={supplier.type} />
            </div>
            <div>
              <CardTitle className="text-base font-medium">{supplier.name}</CardTitle>
              <CardDescription className="text-xs capitalize">
                {supplier.type.replace('_', ' ')}
              </CardDescription>
            </div>
          </div>
          <ConfidenceBadge confidence={supplier.confidence} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price info */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <p className="text-sm text-muted-foreground">Precio estimado</p>
            <p className="text-xl font-bold">
              {supplier.estimated_price 
                ? `$${supplier.estimated_price.toFixed(2)}/${supplier.unit}`
                : 'No disponible'}
            </p>
          </div>
          {savings && savings > 0 && (
            <div className="text-right">
              <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                <TrendingDown className="h-3 w-3 mr-1" />
                {savings.toFixed(0)}% ahorro
              </Badge>
              {estimatedSavings && (
                <p className="text-xs text-muted-foreground mt-1">
                  ~${estimatedSavings}/{supplier.unit}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Contact info */}
        <div className="space-y-2">
          {supplier.contact.phone && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <span>{supplier.contact.phone}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => copyToClipboard(supplier.contact.phone!, 'Teléfono')}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          {supplier.contact.address && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span className="line-clamp-1">{supplier.contact.address}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => copyToClipboard(supplier.contact.address!, 'Dirección')}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          {supplier.contact.hours && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{supplier.contact.hours}</span>
            </div>
          )}
          {supplier.contact.email && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                <span>{supplier.contact.email}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => copyToClipboard(supplier.contact.email!, 'Email')}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Notes */}
        {supplier.notes && (
          <p className="text-xs text-muted-foreground italic border-t pt-2">
            {supplier.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const AnalysisHistoryCard: React.FC<{
  analysis: SupplierAnalysisResult;
  onDelete: (id: string) => void;
}> = ({ analysis, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="mb-3">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {analysis.status === 'completed' ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : analysis.status === 'error' ? (
              <AlertCircle className="h-4 w-4 text-destructive" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            <div>
              <CardTitle className="text-sm font-medium">{analysis.item_name}</CardTitle>
              <CardDescription className="text-xs">
                {analysis.city} • {format(new Date(analysis.created_at), "d MMM yyyy, HH:mm", { locale: es })}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {analysis.potential_savings && analysis.potential_savings > 0 && (
              <Badge variant="secondary" className="text-green-600">
                Hasta {analysis.potential_savings.toFixed(0)}% ahorro
              </Badge>
            )}
            <Badge variant="outline">
              {analysis.alternatives?.length || 0} proveedores
            </Badge>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(analysis.id);
              }}
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-2">
          {analysis.market_insights && (
            <p className="text-sm text-muted-foreground mb-3">{analysis.market_insights}</p>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            {analysis.alternatives?.map((supplier, idx) => (
              <SupplierCard 
                key={idx} 
                supplier={supplier} 
                currentCost={analysis.current_cost}
              />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

const SupplierAnalyzer: React.FC = () => {
  const { toast } = useToast();
  const { inventory, hasData: hasInventory } = useInventoryData();
  const { 
    analysisHistory, 
    historyLoading, 
    analyzing, 
    analyzeSupplier, 
    deleteAnalysis 
  } = useSupplierAnalysis();

  const [selectedItem, setSelectedItem] = useState<string>('');
  const [customItem, setCustomItem] = useState('');
  const [customCost, setCustomCost] = useState('');
  const [customUnit, setCustomUnit] = useState('kg');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('México');
  const [currentAnalysis, setCurrentAnalysis] = useState<SupplierAnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!city.trim()) {
      toast({
        title: "Ciudad requerida",
        description: "Por favor ingresa la ciudad donde está ubicado el restaurante",
        variant: "destructive",
      });
      return;
    }

    let itemName = '';
    let cost = 0;
    let unit = 'kg';
    let supplier = '';
    let inventoryItemId = '';

    if (selectedItem && selectedItem !== 'custom') {
      const item = inventory.find(i => i.id === selectedItem);
      if (item) {
        itemName = item.item_name;
        cost = item.unit_cost || 0;
        unit = item.unit;
        supplier = item.supplier_name || '';
        inventoryItemId = item.id;
      }
    } else {
      itemName = customItem;
      cost = parseFloat(customCost) || 0;
      unit = customUnit;
    }

    if (!itemName.trim()) {
      toast({
        title: "Producto requerido",
        description: "Por favor selecciona o ingresa un producto a analizar",
        variant: "destructive",
      });
      return;
    }

    const result = await analyzeSupplier({
      itemName,
      currentCost: cost,
      currentSupplier: supplier,
      unit,
      city,
      country,
      inventoryItemId: inventoryItemId || undefined,
    });

    if (result) {
      setCurrentAnalysis(result);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="analyze" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analyze">
            <Search className="h-4 w-4 mr-2" />
            Nuevo Análisis
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Historial ({analysisHistory.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analyze" className="space-y-6">
          {/* Analysis Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Buscar Proveedores Alternativos
              </CardTitle>
              <CardDescription>
                Usa IA con búsqueda web para encontrar proveedores reales en tu zona
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Product selection */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Producto a analizar</Label>
                  {hasInventory && inventory.length > 0 ? (
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={selectedItem}
                      onChange={(e) => setSelectedItem(e.target.value)}
                    >
                      <option value="">Selecciona del inventario...</option>
                      {inventory.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.item_name} - ${item.unit_cost?.toFixed(2) || 'N/A'}/{item.unit}
                        </option>
                      ))}
                      <option value="custom">+ Ingresar manualmente</option>
                    </select>
                  ) : (
                    <Input
                      placeholder="Ej: Tomate saladette"
                      value={customItem}
                      onChange={(e) => setCustomItem(e.target.value)}
                    />
                  )}
                </div>

                {(selectedItem === 'custom' || !hasInventory || inventory.length === 0) && (
                  <>
                    <div className="space-y-2">
                      <Label>Costo actual</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="0.00"
                          className="pl-9"
                          value={customCost}
                          onChange={(e) => setCustomCost(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Unidad</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={customUnit}
                        onChange={(e) => setCustomUnit(e.target.value)}
                      >
                        <option value="kg">Kilogramo (kg)</option>
                        <option value="lb">Libra (lb)</option>
                        <option value="lt">Litro (lt)</option>
                        <option value="pza">Pieza (pza)</option>
                        <option value="caja">Caja</option>
                        <option value="bolsa">Bolsa</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              {/* Location */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Ciudad del restaurante *</Label>
                  <Input
                    placeholder="Ej: Ciudad de México, Guadalajara, Monterrey..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>País</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  >
                    <option value="México">México</option>
                    <option value="Colombia">Colombia</option>
                    <option value="Argentina">Argentina</option>
                    <option value="Chile">Chile</option>
                    <option value="Perú">Perú</option>
                    <option value="España">España</option>
                  </select>
                </div>
              </div>

              <Button 
                onClick={handleAnalyze} 
                disabled={analyzing}
                className="w-full"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Buscando proveedores...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Analizar Proveedores
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Current Analysis Results */}
          {currentAnalysis && currentAnalysis.status === 'completed' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Resultados: {currentAnalysis.item_name}
                </CardTitle>
                <CardDescription>
                  {currentAnalysis.city}, {currentAnalysis.country} • {currentAnalysis.alternatives?.length || 0} proveedores encontrados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Market insights */}
                {currentAnalysis.market_insights && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">Análisis del Mercado</h4>
                    <p className="text-sm text-muted-foreground">{currentAnalysis.market_insights}</p>
                  </div>
                )}

                {/* Recommendations */}
                {currentAnalysis.recommendations && currentAnalysis.recommendations.length > 0 && (
                  <div className="p-4 rounded-lg border">
                    <h4 className="font-medium mb-2">Recomendaciones</h4>
                    <ul className="space-y-1">
                      {currentAnalysis.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suppliers grid */}
                <div className="grid gap-4 md:grid-cols-2">
                  {currentAnalysis.alternatives?.map((supplier, idx) => (
                    <SupplierCard 
                      key={idx} 
                      supplier={supplier} 
                      currentCost={currentAnalysis.current_cost}
                    />
                  ))}
                </div>

                {currentAnalysis.alternatives?.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No se encontraron proveedores específicos para este producto.</p>
                    <p className="text-sm">Intenta con términos más generales o verifica la ciudad.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Análisis</CardTitle>
              <CardDescription>
                Consulta tus análisis anteriores de proveedores
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : analysisHistory.length > 0 ? (
                <ScrollArea className="h-[500px] pr-4">
                  {analysisHistory.map((analysis) => (
                    <AnalysisHistoryCard
                      key={analysis.id}
                      analysis={analysis}
                      onDelete={deleteAnalysis}
                    />
                  ))}
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No tienes análisis previos.</p>
                  <p className="text-sm">Realiza tu primer análisis de proveedores.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SupplierAnalyzer;