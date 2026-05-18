import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ClipboardList, Plus, Send, Package, Check, X, FileText, Wand2 } from 'lucide-react';
import { PurchaseOrder, InventorySupplier, InventoryItemExtended, PurchaseOrderItem } from '@/hooks/useEnterpriseInventory';
import { ReceiveOrderDialog } from './ReceiveOrderDialog';
import { PurchaseOrderSchema } from '@/lib/schemas/purchaseOrder';
import { toast } from 'sonner';

interface Props {
  orders: PurchaseOrder[];
  suppliers: InventorySupplier[];
  inventory: InventoryItemExtended[];
  onCreate: (data: Partial<PurchaseOrder>, items: Partial<PurchaseOrderItem>[]) => Promise<any>;
  onUpdate: (id: string, data: Partial<PurchaseOrder>) => Promise<void>;
  onReceive: (orderId: string, receivedItems: { id: string; quantity_received: number; lot_number?: string; expiration_date?: string }[]) => Promise<void>;
  onGenerateFromPar: (supplierId?: string) => Promise<any>;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'Borrador', color: 'bg-gray-500' },
  sent: { label: 'Enviada', color: 'bg-blue-500' },
  partial: { label: 'Parcial', color: 'bg-yellow-500' },
  received: { label: 'Recibida', color: 'bg-green-500' },
  cancelled: { label: 'Cancelada', color: 'bg-red-500' }
};

export const PurchaseOrdersManager = ({ orders, suppliers, inventory, onCreate, onUpdate, onReceive, onGenerateFromPar }: Props) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [orderToReceive, setOrderToReceive] = useState<PurchaseOrder | null>(null);
  const [formData, setFormData] = useState({
    supplier_id: '',
    expected_delivery: '',
    notes: ''
  });
  const [orderItems, setOrderItems] = useState<{ inventory_item_id: string; quantity: number; unit_cost: number }[]>([]);

  const resetForm = () => {
    setFormData({ supplier_id: '', expected_delivery: '', notes: '' });
    setOrderItems([]);
  };

  const addOrderItem = () => {
    setOrderItems([...orderItems, { inventory_item_id: '', quantity: 1, unit_cost: 0 }]);
  };

  const updateOrderItem = (index: number, field: string, value: any) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-fill unit cost when item selected
    if (field === 'inventory_item_id') {
      const item = inventory.find(i => i.id === value);
      if (item) {
        updated[index].unit_cost = item.unit_cost || 0;
      }
    }
    
    setOrderItems(updated);
  };

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const items: Partial<PurchaseOrderItem>[] = orderItems
      .filter(item => item.inventory_item_id)
      .map(item => ({
        inventory_item_id: item.inventory_item_id,
        quantity_ordered: item.quantity,
        unit: inventory.find(i => i.id === item.inventory_item_id)?.unit || 'unidades',
        unit_cost: item.unit_cost,
        total_cost: item.quantity * item.unit_cost
      }));

    const subtotal = items.reduce((sum, i) => sum + (i.total_cost || 0), 0);

    await onCreate({
      supplier_id: formData.supplier_id || undefined,
      expected_delivery: formData.expected_delivery || undefined,
      notes: formData.notes || undefined,
      subtotal,
      total_amount: subtotal
    }, items);

    setDialogOpen(false);
    resetForm();
  };

  const handleGenerateAuto = async () => {
    await onGenerateFromPar();
  };

  const handleOpenReceive = (order: PurchaseOrder) => {
    setOrderToReceive(order);
    setReceiveDialogOpen(true);
  };

  const getSupplierName = (id: string | null) => {
    if (!id) return '-';
    return suppliers.find(s => s.id === id)?.supplier_name || '-';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          Órdenes de Compra ({orders.length})
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleGenerateAuto}>
            <Wand2 className="h-4 w-4 mr-2" />
            Generar desde Par Levels
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Orden
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nueva Orden de Compra</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Proveedor</Label>
                    <Select value={formData.supplier_id} onValueChange={(v) => setFormData({ ...formData, supplier_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.filter(s => s.id).map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.supplier_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Entrega Esperada</Label>
                    <Input
                      type="date"
                      value={formData.expected_delivery}
                      onChange={(e) => setFormData({ ...formData, expected_delivery: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Ítems de la Orden</Label>
                    <Button variant="outline" size="sm" onClick={addOrderItem}>
                      <Plus className="h-4 w-4 mr-1" /> Agregar Ítem
                    </Button>
                  </div>
                  
                  {orderItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Agrega ítems a la orden de compra
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {orderItems.map((item, index) => (
                        <div key={index} className="flex gap-2 items-end p-2 border rounded">
                          <div className="flex-1">
                            <Label className="text-xs">Producto</Label>
                            <Select 
                              value={item.inventory_item_id} 
                              onValueChange={(v) => updateOrderItem(index, 'inventory_item_id', v)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar" />
                              </SelectTrigger>
                              <SelectContent>
                                {inventory.filter(i => i.id).map(i => (
                                  <SelectItem key={i.id} value={i.id}>
                                    {i.item_name} ({i.current_stock} {i.unit})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-24">
                            <Label className="text-xs">Cantidad</Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateOrderItem(index, 'quantity', Number(e.target.value))}
                              min={1}
                            />
                          </div>
                          <div className="w-28">
                            <Label className="text-xs">Costo Unit.</Label>
                            <Input
                              type="number"
                              value={item.unit_cost}
                              onChange={(e) => updateOrderItem(index, 'unit_cost', Number(e.target.value))}
                              min={0}
                              step={0.01}
                            />
                          </div>
                          <div className="w-24">
                            <Label className="text-xs">Total</Label>
                            <p className="h-10 flex items-center font-medium">
                              ${(item.quantity * item.unit_cost).toFixed(2)}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeOrderItem(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="text-right font-bold pt-2">
                        Total: ${orderItems.reduce((sum, i) => sum + i.quantity * i.unit_cost, 0).toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Notas</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Notas adicionales..."
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => { setDialogOpen(false); resetForm(); }}>
                    Cancelar
                  </Button>
                  <Button className="flex-1" onClick={handleSubmit} disabled={orderItems.length === 0}>
                    Crear Orden
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Sin órdenes de compra</p>
            <p className="text-sm">Crea órdenes manualmente o genera desde par levels</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Orden #</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Entrega</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const status = statusConfig[order.status] || statusConfig.draft;
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono">{order.order_number}</TableCell>
                    <TableCell>{getSupplierName(order.supplier_id)}</TableCell>
                    <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {order.expected_delivery 
                        ? new Date(order.expected_delivery).toLocaleDateString() 
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${order.total_amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={status.color}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {order.status === 'draft' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => onUpdate(order.id, { status: 'sent' })}
                        >
                          <Send className="h-4 w-4 mr-1" /> Enviar
                        </Button>
                      )}
                      {(order.status === 'sent' || order.status === 'partial') && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenReceive(order)}
                        >
                          <Package className="h-4 w-4 mr-1" /> Recibir
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Receive Order Dialog */}
      <ReceiveOrderDialog
        order={orderToReceive}
        isOpen={receiveDialogOpen}
        onClose={() => { setReceiveDialogOpen(false); setOrderToReceive(null); }}
        onReceive={onReceive}
      />
    </div>
  );
};
