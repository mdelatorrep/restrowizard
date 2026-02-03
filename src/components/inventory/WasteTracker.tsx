import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, AlertCircle, TrendingDown, DollarSign } from 'lucide-react';
import { InventoryWaste, InventoryItemExtended, StorageLocation } from '@/hooks/useEnterpriseInventory';

interface Props {
  waste: InventoryWaste[];
  inventory: InventoryItemExtended[];
  locations: StorageLocation[];
  onRecord: (data: Partial<InventoryWaste>) => Promise<any>;
  wasteThisMonth: number;
}

const wasteReasons = [
  { value: 'spoilage', label: 'Descomposición', icon: '🦠' },
  { value: 'expired', label: 'Vencimiento', icon: '📅' },
  { value: 'damaged', label: 'Daño/Rotura', icon: '💔' },
  { value: 'preparation', label: 'Preparación', icon: '🔪' },
  { value: 'over_production', label: 'Sobreproducción', icon: '📦' },
  { value: 'other', label: 'Otro', icon: '❓' }
];

export const WasteTracker = ({ waste, inventory, locations, onRecord, wasteThisMonth }: Props) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    inventory_item_id: '',
    quantity: 0,
    waste_reason: 'spoilage',
    is_preventable: false,
    lot_number: '',
    storage_location_id: '',
    notes: '',
    reported_by: ''
  });

  const resetForm = () => {
    setFormData({
      inventory_item_id: '',
      quantity: 0,
      waste_reason: 'spoilage',
      is_preventable: false,
      lot_number: '',
      storage_location_id: '',
      notes: '',
      reported_by: ''
    });
  };

  const handleSubmit = async () => {
    const item = inventory.find(i => i.id === formData.inventory_item_id);
    await onRecord({
      ...formData,
      unit: item?.unit || 'unidades',
      unit_cost: item?.unit_cost || 0,
      storage_location_id: formData.storage_location_id || undefined
    });
    setDialogOpen(false);
    resetForm();
  };

  const getItemName = (id: string) => {
    return inventory.find(i => i.id === id)?.item_name || '-';
  };

  const getReasonInfo = (reason: string) => {
    return wasteReasons.find(r => r.value === reason) || { label: reason, icon: '❓' };
  };

  const preventableWaste = waste.filter(w => w.is_preventable);
  const preventableValue = preventableWaste.reduce((sum, w) => sum + (w.total_cost || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-destructive" />
          Registro de Mermas
        </h3>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" variant="destructive">
              <Plus className="h-4 w-4 mr-2" />
              Registrar Merma
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Merma/Desperdicio</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Producto *</Label>
                <Select 
                  value={formData.inventory_item_id} 
                  onValueChange={(v) => setFormData({ ...formData, inventory_item_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventory.map(item => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.item_name} ({item.current_stock} {item.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cantidad *</Label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    min={0}
                    step={0.1}
                  />
                </div>
                <div>
                  <Label>Razón *</Label>
                  <Select 
                    value={formData.waste_reason} 
                    onValueChange={(v) => setFormData({ ...formData, waste_reason: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {wasteReasons.map(reason => (
                        <SelectItem key={reason.value} value={reason.value}>
                          {reason.icon} {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Ubicación</Label>
                <Select 
                  value={formData.storage_location_id} 
                  onValueChange={(v) => setFormData({ ...formData, storage_location_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar ubicación" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.location_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Número de Lote</Label>
                <Input
                  value={formData.lot_number}
                  onChange={(e) => setFormData({ ...formData, lot_number: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <Label>¿Era prevenible?</Label>
                  <p className="text-sm text-muted-foreground">Marcar para análisis de mejora</p>
                </div>
                <Switch
                  checked={formData.is_preventable}
                  onCheckedChange={(v) => setFormData({ ...formData, is_preventable: v })}
                />
              </div>
              <div>
                <Label>Reportado por</Label>
                <Input
                  value={formData.reported_by}
                  onChange={(e) => setFormData({ ...formData, reported_by: e.target.value })}
                  placeholder="Nombre"
                />
              </div>
              <div>
                <Label>Notas</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Detalles adicionales..."
                  rows={2}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button 
                  className="flex-1" 
                  variant="destructive"
                  onClick={handleSubmit} 
                  disabled={!formData.inventory_item_id || formData.quantity <= 0}
                >
                  Registrar Merma
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Merma del Mes</p>
                <p className="text-2xl font-bold text-destructive">${wasteThisMonth.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-destructive opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Registros este mes</p>
                <p className="text-2xl font-bold">{waste.length}</p>
              </div>
              <Trash2 className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className={preventableValue > 0 ? 'border-yellow-500' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Merma Prevenible</p>
                <p className="text-2xl font-bold text-yellow-600">${preventableValue.toLocaleString()}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Waste log */}
      {waste.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Trash2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Sin mermas registradas</p>
            <p className="text-sm">Registra mermas para análisis de pérdidas</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Razón</TableHead>
                <TableHead className="text-right">Costo</TableHead>
                <TableHead>Prevenible</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {waste.slice(0, 20).map((w) => {
                const reasonInfo = getReasonInfo(w.waste_reason);
                return (
                  <TableRow key={w.id}>
                    <TableCell>{new Date(w.waste_date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{getItemName(w.inventory_item_id)}</TableCell>
                    <TableCell>{w.quantity} {w.unit}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        {reasonInfo.icon} {reasonInfo.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-destructive">
                      ${(w.total_cost || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {w.is_preventable && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Sí
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};
