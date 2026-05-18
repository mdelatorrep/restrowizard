import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, History, Loader2 } from 'lucide-react';
import { useSupplierAnalysis, SupplierAnalysisResult } from '@/hooks/useSupplierAnalysis';
import { useInventoryData } from '@/hooks/useInventoryData';
import { useToast } from '@/hooks/use-toast';
import { SupplierAnalysisForm } from './supplier-analyzer/SupplierAnalysisForm';
import { SupplierAnalysisResults } from './supplier-analyzer/SupplierAnalysisResults';
import { AnalysisHistoryCard } from './supplier-analyzer/AnalysisHistoryCard';

const SupplierAnalyzer: React.FC = () => {
  const { toast } = useToast();
  const { inventory, hasData: hasInventory } = useInventoryData();
  const { analysisHistory, historyLoading, analyzing, analyzeSupplier, deleteAnalysis } = useSupplierAnalysis();

  const [selectedItem, setSelectedItem] = useState('');
  const [customItem, setCustomItem] = useState('');
  const [customCost, setCustomCost] = useState('');
  const [customUnit, setCustomUnit] = useState('kg');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('México');
  const [currentAnalysis, setCurrentAnalysis] = useState<SupplierAnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!city.trim()) {
      toast({ title: 'Ciudad requerida', description: 'Por favor ingresa la ciudad donde está ubicado el restaurante', variant: 'destructive' });
      return;
    }

    let itemName = '';
    let cost = 0;
    let unit = 'kg';
    let supplier = '';
    let inventoryItemId = '';

    if (selectedItem && selectedItem !== 'custom') {
      const item = inventory.find((i) => i.id === selectedItem);
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
      toast({ title: 'Producto requerido', description: 'Por favor selecciona o ingresa un producto a analizar', variant: 'destructive' });
      return;
    }

    const result = await analyzeSupplier({
      itemName, currentCost: cost, currentSupplier: supplier, unit, city, country,
      inventoryItemId: inventoryItemId || undefined,
    });
    if (result) setCurrentAnalysis(result);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="analyze" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analyze"><Search className="h-4 w-4 mr-2" />Nuevo Análisis</TabsTrigger>
          <TabsTrigger value="history"><History className="h-4 w-4 mr-2" />Historial ({analysisHistory.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="analyze" className="space-y-6">
          <SupplierAnalysisForm
            inventory={inventory}
            hasInventory={hasInventory}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            customItem={customItem}
            setCustomItem={setCustomItem}
            customCost={customCost}
            setCustomCost={setCustomCost}
            customUnit={customUnit}
            setCustomUnit={setCustomUnit}
            city={city}
            setCity={setCity}
            country={country}
            setCountry={setCountry}
            analyzing={analyzing}
            onAnalyze={handleAnalyze}
          />
          {currentAnalysis && currentAnalysis.status === 'completed' && (
            <SupplierAnalysisResults analysis={currentAnalysis} />
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Análisis</CardTitle>
              <CardDescription>Consulta tus análisis anteriores de proveedores</CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : analysisHistory.length > 0 ? (
                <ScrollArea className="h-[500px] pr-4">
                  {analysisHistory.map((analysis) => (
                    <AnalysisHistoryCard key={analysis.id} analysis={analysis} onDelete={deleteAnalysis} />
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
