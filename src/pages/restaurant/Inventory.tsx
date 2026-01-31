import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { AIInsightsPanel } from '@/components/AIInsightsPanel';
import { Package, Plus, AlertTriangle, TrendingDown, DollarSign, RefreshCw, Search, Sparkles, Brain } from 'lucide-react';
import { useInventoryData, InventoryItem } from '@/hooks/useInventoryData';
import { useAIAgent } from '@/hooks/useAIAgent';
import { toast } from 'sonner';

const Inventory: React.FC = () => {
  const { inventory, kpis, loading, hasData, addInventoryItem, updateInventoryItem, deleteInventoryItem, refetch } = useInventoryData();
  const { optimizeReorders, predictExpiry, analyzeCostTrends, loading: aiLoading } = useAIAgent();
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [formData, setFormData] = useState({
    item_name: '',
    category: '',
    current_stock: 0,
    unit: 'unidades',
    unit_cost: 0,
    reorder_point: 10,
    supplier_name: ''
  });

  const filteredInventory = inventory.filter(item =>
    item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.category?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingItem) {
      await updateInventoryItem(editingItem.id, formData);
    } else {
      await addInventoryItem(formData as any);
    }
    
    setDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      item_name: '',
      category: '',
      current_stock: 0,
      unit: 'unidades',
      unit_cost: 0,
      reorder_point: 10,
      supplier_name: ''
    });
    setEditingItem(null);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name,
      category: item.category || '',
      current_stock: item.current_stock,
      unit: item.unit,
      unit_cost: item.unit_cost || 0,
      reorder_point: item.reorder_point || 10,
      supplier_name: item.supplier_name || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este ítem?')) {
      await deleteInventoryItem(id);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.current_stock <= 0) {
      return { label: 'Agotado', variant: 'destructive' as const };
    }
    if (item.reorder_point && item.current_stock <= item.reorder_point) {
      return { label: 'Stock Bajo', variant: 'secondary' as const };
    }
    return { label: 'Normal', variant: 'default' as const };
  };

  // AI Analysis handler
  const handleAIAnalysis = async () => {
    if (inventory.length === 0) {
      toast.error('Agrega items al inventario para poder analizarlos');
      return;
    }
    
    const inventoryData = inventory.map(item => ({
      nombre: item.item_name,
      categoria: item.category,
      stock_actual: item.current_stock,
      punto_reorden: item.reorder_point,
      costo_unitario: item.unit_cost,
      unidad: item.unit,
      proveedor: item.supplier_name
    }));

    const result = await optimizeReorders({
      items: inventoryData,
      total_items: kpis?.totalItems || 0,
      valor_total: kpis?.totalValue || 0,
      items_stock_bajo: kpis?.lowStockItems?.length || 0,
      items_agotados: kpis?.outOfStockItems?.length || 0
    });
    
    if (result) {
      setAiInsights(result);
      setShowAIPanel(true);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground flex items-center">
            <Package className="mr-3 text-primary" size={32} />
            Gestión de Inventarios
          </h1>
          <p className="text-muted-foreground font-lato-light">
            Controla stock, costos y proveedores de tu inventario
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleAIAnalysis}
            disabled={aiLoading}
            className="gap-2 border-primary/30 hover:bg-primary/10"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            {aiLoading ? 'Analizando...' : 'Análisis IA'}
          </Button>
          <Button variant="outline" onClick={refetch}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Ítem
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Editar Ítem' : 'Nuevo Ítem de Inventario'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Nombre del Ítem</Label>
                    <Input 
                      value={formData.item_name}
                      onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                      placeholder="Ej: Tomate Cherry"
                      required
                    />
                  </div>
                  <div>
                    <Label>Categoría</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Vegetales">Vegetales</SelectItem>
                        <SelectItem value="Frutas">Frutas</SelectItem>
                        <SelectItem value="Carnes">Carnes</SelectItem>
                        <SelectItem value="Lácteos">Lácteos</SelectItem>
                        <SelectItem value="Granos">Granos</SelectItem>
                        <SelectItem value="Bebidas">Bebidas</SelectItem>
                        <SelectItem value="Condimentos">Condimentos</SelectItem>
                        <SelectItem value="Limpieza">Limpieza</SelectItem>
                        <SelectItem value="Empaques">Empaques</SelectItem>
                        <SelectItem value="Otros">Otros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Unidad</Label>
                    <Select value={formData.unit} onValueChange={(v) => setFormData({...formData, unit: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unidades">Unidades</SelectItem>
                        <SelectItem value="kg">Kilogramos</SelectItem>
                        <SelectItem value="g">Gramos</SelectItem>
                        <SelectItem value="lt">Litros</SelectItem>
                        <SelectItem value="ml">Mililitros</SelectItem>
                        <SelectItem value="lb">Libras</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Stock Actual</Label>
                    <Input 
                      type="number"
                      value={formData.current_stock}
                      onChange={(e) => setFormData({...formData, current_stock: Number(e.target.value)})}
                      min={0}
                    />
                  </div>
                  <div>
                    <Label>Punto de Reorden</Label>
                    <Input 
                      type="number"
                      value={formData.reorder_point}
                      onChange={(e) => setFormData({...formData, reorder_point: Number(e.target.value)})}
                      min={0}
                    />
                  </div>
                  <div>
                    <Label>Costo Unitario ($)</Label>
                    <Input 
                      type="number"
                      value={formData.unit_cost}
                      onChange={(e) => setFormData({...formData, unit_cost: Number(e.target.value)})}
                      min={0}
                      step={0.01}
                    />
                  </div>
                  <div>
                    <Label>Proveedor</Label>
                    <Input 
                      value={formData.supplier_name}
                      onChange={(e) => setFormData({...formData, supplier_name: e.target.value})}
                      placeholder="Nombre del proveedor"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingItem ? 'Guardar Cambios' : 'Agregar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPIs */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold">{kpis.totalItems}</p>
                </div>
                <Package className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-2xl font-bold">${kpis.totalValue.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Stock Bajo</p>
                  <p className="text-2xl font-bold text-yellow-600">{kpis.lowStockItems.length}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Agotados</p>
                  <p className="text-2xl font-bold text-red-600">{kpis.outOfStockItems.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Insights Panel */}
      {showAIPanel && (
        <AIInsightsPanel
          title="Análisis de Inventario"
          description="Optimización de stock y predicción de necesidades"
          insights={aiInsights}
          loading={aiLoading}
          onAnalyze={handleAIAnalysis}
          onClose={() => setShowAIPanel(false)}
          icon={<Brain className="w-5 h-5 text-primary" />}
        />
      )}

      {!hasData ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Sin items de inventario</h3>
          <p className="text-muted-foreground mb-6">
            Agrega tu primer ítem de inventario para comenzar a gestionar tu stock.
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Primer Ítem
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="all">Todos ({inventory.length})</TabsTrigger>
              <TabsTrigger value="low">Stock Bajo ({kpis?.lowStockItems.length || 0})</TabsTrigger>
              <TabsTrigger value="out">Agotados ({kpis?.outOfStockItems.length || 0})</TabsTrigger>
            </TabsList>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <TabsContent value="all">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Costo Unit.</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => {
                    const status = getStockStatus(item);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.item_name}</TableCell>
                        <TableCell>{item.category || '-'}</TableCell>
                        <TableCell className="text-right">{item.current_stock} {item.unit}</TableCell>
                        <TableCell className="text-right">${(item.unit_cost || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-right">${(item.current_stock * (item.unit_cost || 0)).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>{item.supplier_name || '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                            Editar
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(item.id)}>
                            Eliminar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="low">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="text-right">Stock Actual</TableHead>
                    <TableHead className="text-right">Punto Reorden</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kpis?.lowStockItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.item_name}</TableCell>
                      <TableCell className="text-right text-yellow-600 font-bold">{item.current_stock} {item.unit}</TableCell>
                      <TableCell className="text-right">{item.reorder_point} {item.unit}</TableCell>
                      <TableCell>{item.supplier_name || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                          Reabastecer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="out">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kpis?.outOfStockItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.item_name}</TableCell>
                      <TableCell>{item.category || '-'}</TableCell>
                      <TableCell>{item.supplier_name || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                          Reabastecer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Inventory;
