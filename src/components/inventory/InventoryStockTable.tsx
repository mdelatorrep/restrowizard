import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Edit, Trash2 } from 'lucide-react';
import type { InventoryItemExtended } from '@/hooks/useEnterpriseInventory';

export type StockStatus = { label: string; variant: 'destructive' | 'secondary' | 'default' };

export function getStockStatus(item: InventoryItemExtended): StockStatus {
  if (item.current_stock <= 0) {
    return { label: 'Agotado', variant: 'destructive' };
  }
  if (item.expiration_date) {
    const expDate = new Date(item.expiration_date);
    const daysUntil = Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 0) return { label: 'Vencido', variant: 'destructive' };
    if (daysUntil <= 3) return { label: `Vence en ${daysUntil}d`, variant: 'destructive' };
    if (daysUntil <= 7) return { label: `Vence en ${daysUntil}d`, variant: 'secondary' };
  }
  if (item.par_level > 0 && item.current_stock < item.par_level) {
    return { label: 'Bajo Par', variant: 'secondary' };
  }
  if (item.reorder_point && item.current_stock <= item.reorder_point) {
    return { label: 'Stock Bajo', variant: 'secondary' };
  }
  return { label: 'Normal', variant: 'default' };
}

interface Props {
  items: InventoryItemExtended[];
  onView: (item: InventoryItemExtended) => void;
  onEdit: (item: InventoryItemExtended) => void;
  onDelete: (id: string) => void;
  limit?: number;
}

export const InventoryStockTable = ({ items, onView, onEdit, onDelete, limit = 50 }: Props) => (
  <Card>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Ubicación</TableHead>
          <TableHead className="text-right">Stock</TableHead>
          <TableHead className="text-right">Par Level</TableHead>
          <TableHead className="text-right">Costo</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.slice(0, limit).map((item) => {
          const status = getStockStatus(item);
          return (
            <TableRow key={item.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{item.item_name}</p>
                  {(item.barcode || item.sku) && (
                    <p className="text-xs text-muted-foreground">{item.sku || item.barcode}</p>
                  )}
                </div>
              </TableCell>
              <TableCell>{item.category || '-'}</TableCell>
              <TableCell>{item.storage_location?.location_name || '-'}</TableCell>
              <TableCell className="text-right">
                <span className={item.current_stock <= 0 ? 'text-red-600' : ''}>
                  {item.current_stock} {item.unit}
                </span>
              </TableCell>
              <TableCell className="text-right">
                {item.par_level > 0 ? (
                  <span className={item.current_stock < item.par_level ? 'text-yellow-600' : ''}>
                    {item.par_level}
                  </span>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell className="text-right">${(item.unit_cost || 0).toFixed(2)}</TableCell>
              <TableCell>
                <Badge variant={status.variant}>{status.label}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => onView(item)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => onDelete(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </Card>
);
