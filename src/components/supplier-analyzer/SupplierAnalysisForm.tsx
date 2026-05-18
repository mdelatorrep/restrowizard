import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Loader2, DollarSign } from 'lucide-react';
import type { InventoryItem } from '@/hooks/useInventoryData';

interface Props {
  inventory: InventoryItem[];
  hasInventory: boolean;
  selectedItem: string;
  setSelectedItem: (v: string) => void;
  customItem: string;
  setCustomItem: (v: string) => void;
  customCost: string;
  setCustomCost: (v: string) => void;
  customUnit: string;
  setCustomUnit: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  country: string;
  setCountry: (v: string) => void;
  analyzing: boolean;
  onAnalyze: () => void;
}

const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export const SupplierAnalysisForm: React.FC<Props> = ({
  inventory, hasInventory, selectedItem, setSelectedItem,
  customItem, setCustomItem, customCost, setCustomCost, customUnit, setCustomUnit,
  city, setCity, country, setCountry, analyzing, onAnalyze,
}) => {
  const showCustomFields = selectedItem === 'custom' || !hasInventory || inventory.length === 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Buscar Proveedores Alternativos
        </CardTitle>
        <CardDescription>Usa IA con búsqueda web para encontrar proveedores reales en tu zona</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Producto a analizar</Label>
            {hasInventory && inventory.length > 0 ? (
              <select className={selectClass} value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)}>
                <option value="">Selecciona del inventario...</option>
                {inventory.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.item_name} - ${item.unit_cost?.toFixed(2) || 'N/A'}/{item.unit}
                  </option>
                ))}
                <option value="custom">+ Ingresar manualmente</option>
              </select>
            ) : (
              <Input placeholder="Ej: Tomate saladette" value={customItem} onChange={(e) => setCustomItem(e.target.value)} />
            )}
          </div>

          {showCustomFields && (
            <>
              <div className="space-y-2">
                <Label>Costo actual</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input type="number" placeholder="0.00" className="pl-9" value={customCost}
                    onChange={(e) => setCustomCost(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Unidad</Label>
                <select className={selectClass} value={customUnit} onChange={(e) => setCustomUnit(e.target.value)}>
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

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Ciudad del restaurante *</Label>
            <Input placeholder="Ej: Ciudad de México, Guadalajara, Monterrey..." value={city}
              onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>País</Label>
            <select className={selectClass} value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="México">México</option>
              <option value="Colombia">Colombia</option>
              <option value="Argentina">Argentina</option>
              <option value="Chile">Chile</option>
              <option value="Perú">Perú</option>
              <option value="España">España</option>
            </select>
          </div>
        </div>

        <Button onClick={onAnalyze} disabled={analyzing} className="w-full">
          {analyzing ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Buscando proveedores...</>
          ) : (
            <><Search className="h-4 w-4 mr-2" />Analizar Proveedores</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
