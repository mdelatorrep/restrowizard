import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, Search, ShoppingCart } from 'lucide-react';
import {
  InventoryStockTable,
} from '@/components/inventory/InventoryStockTable';
import type { InventoryItemExtended } from '@/hooks/useEnterpriseInventory';

interface InventoryItemsTabProps {
  hasData: boolean;
  items: InventoryItemExtended[];
  searchTerm: string;
  onSearchChange: (v: string) => void;
  onAdd: () => void;
  onView: (item: InventoryItemExtended) => void;
  onEdit: (item: InventoryItemExtended) => void;
  onDelete: (id: string) => void;
  onGenerateOrder?: () => void; // TK-16
}

export const InventoryItemsTab = ({
  hasData,
  items,
  searchTerm,
  onSearchChange,
  onAdd,
  onView,
  onEdit,
  onDelete,
  onGenerateOrder,
}: InventoryItemsTabProps) => {
  if (!hasData) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Sin items de inventario</h3>
          <p className="text-muted-foreground mb-6">
            Agrega tu primer ítem de inventario para comenzar.
          </p>
          <Button onClick={onAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Primer Ítem
          </Button>
        </CardContent>
      </Card>
    );
  }

  // TK-16: ítems con proveedor asignado y bajo par level
  const orderableCount = items.filter(
    (i) => i.par_level > 0 && i.current_stock < i.par_level && i.preferred_supplier_id
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, categoría, código..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="outline">{items.length} items</Badge>
        {onGenerateOrder && orderableCount > 0 && (
          <Button size="sm" variant="default" onClick={onGenerateOrder} className="ml-auto">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Ordenar ({orderableCount})
          </Button>
        )}
      </div>

      <InventoryStockTable
        items={items}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
};
