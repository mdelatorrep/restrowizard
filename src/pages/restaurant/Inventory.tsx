import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AIInsightsPanel } from '@/components/AIInsightsPanel';
import { StorageLocationsManager } from '@/components/inventory/StorageLocationsManager';
import { SuppliersManager } from '@/components/inventory/SuppliersManager';
import { PurchaseOrdersManager } from '@/components/inventory/PurchaseOrdersManager';
import { InventoryCountsManager } from '@/components/inventory/InventoryCountsManager';
import { WasteTracker } from '@/components/inventory/WasteTracker';
import { BarcodeScanner } from '@/components/inventory/BarcodeScanner';
import { InventoryItemForm } from '@/components/inventory/InventoryItemForm';
import { CriticalAlertsPanel } from '@/components/inventory/CriticalAlertsPanel';
import { ExpirationTracker } from '@/components/inventory/ExpirationTracker';
import { RecipeIntegrationPanel } from '@/components/inventory/RecipeIntegrationPanel';
import { TransferDialog } from '@/components/inventory/TransferDialog';
import { InventoryItemDetail } from '@/components/inventory/InventoryItemDetail';
import { InventoryReports } from '@/components/inventory/InventoryReports';
import { 
  Package, Plus, AlertTriangle, TrendingDown, DollarSign, 
  RefreshCw, Search, Sparkles, Brain, Warehouse, Truck,
  ClipboardList, ClipboardCheck, Trash2, Scan, Edit,
  Calendar, ChefHat, Clock, MoveHorizontal, Eye, BarChart3
} from 'lucide-react';
import { useEnterpriseInventory, InventoryItemExtended, PurchaseOrder } from '@/hooks/useEnterpriseInventory';
import { useAIAgent } from '@/hooks/useAIAgent';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Inventory: React.FC = () => {
  const { 
    inventory, 
    storageLocations,
    suppliers,
    purchaseOrders,
    inventoryCounts,
    waste,
    kpis, 
    loading, 
    hasData,
    refetch,
    // Storage locations
    createStorageLocation,
    updateStorageLocation,
    deleteStorageLocation,
    // Suppliers
    createSupplier,
    updateSupplier,
    deleteSupplier,
    // Inventory Items
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    adjustStock,
    lookupByBarcode,
    // Purchase Orders
    createPurchaseOrder,
    updatePurchaseOrder,
    receivePurchaseOrder,
    generatePOFromParLevels,
    transferInventory,
    getPriceHistory,
    getItemMovements,
    // Counts
    createInventoryCount,
    completeCount,
    // Waste
    recordWaste
  } = useEnterpriseInventory();
  
  const { optimizeReorders, loading: aiLoading } = useAIAgent();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('items');
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItemExtended | null>(null);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<InventoryItemExtended | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const filteredInventory = inventory.filter(item =>
    item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.category?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.barcode?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.sku?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEdit = (item: InventoryItemExtended) => {
    setEditingItem(item);
    setItemFormOpen(true);
  };

  const handleViewDetail = (item: InventoryItemExtended) => {
    setDetailItem(item);
    setDetailOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este ítem?')) {
      await deleteInventoryItem(id);
    }
  };

  const getStockStatus = (item: InventoryItemExtended) => {
    if (item.current_stock <= 0) {
      return { label: 'Agotado', variant: 'destructive' as const };
    }
    if (item.expiration_date) {
      const expDate = new Date(item.expiration_date);
      const daysUntil = Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 0) return { label: 'Vencido', variant: 'destructive' as const };
      if (daysUntil <= 3) return { label: `Vence en ${daysUntil}d`, variant: 'destructive' as const };
      if (daysUntil <= 7) return { label: `Vence en ${daysUntil}d`, variant: 'secondary' as const };
    }
    if (item.par_level > 0 && item.current_stock < item.par_level) {
      return { label: 'Bajo Par', variant: 'secondary' as const };
    }
    if (item.reorder_point && item.current_stock <= item.reorder_point) {
      return { label: 'Stock Bajo', variant: 'secondary' as const };
    }
    return { label: 'Normal', variant: 'default' as const };
  };

  const handleAIAnalysis = async () => {
    if (inventory.length === 0) {
      toast.error('Agrega items al inventario para poder analizarlos');
      return;
    }
    
    const inventoryData = inventory.map(item => ({
      nombre: item.item_name,
      categoria: item.category,
      stock_actual: item.current_stock,
      par_level: item.par_level,
      punto_reorden: item.reorder_point,
      costo_unitario: item.unit_cost,
      unidad: item.unit,
      proveedor: item.supplier_name,
      vencimiento: item.expiration_date
    }));

    const result = await optimizeReorders({
      items: inventoryData,
      total_items: kpis?.totalItems || 0,
      valor_total: kpis?.totalValue || 0,
      items_stock_bajo: kpis?.lowStockItems || 0,
      items_agotados: kpis?.outOfStockItems || 0,
      items_por_vencer: kpis?.expiringItems || 0,
      items_bajo_par: kpis?.belowParItems || 0
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground flex items-center">
            <Package className="mr-3 h-8 w-8 text-primary" />
            Gestión de Inventarios
          </h1>
          <p className="text-muted-foreground font-lato-light">
            Control enterprise de stock, proveedores y compras
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setTransferDialogOpen(true)} className="gap-2">
            <MoveHorizontal className="w-4 h-4" />
            Transferir
          </Button>
          <Button variant="outline" onClick={() => setScannerOpen(true)} className="gap-2">
            <Scan className="w-4 h-4" />
            Escanear
          </Button>
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
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={() => { setEditingItem(null); setItemFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Ítem
          </Button>
        </div>
      </div>

      {/* Critical Alerts Panel */}
      {kpis && (kpis.expiredItems > 0 || kpis.outOfStockItems > 0 || kpis.expiringItems > 0 || kpis.belowParItems > 0) && (
        <CriticalAlertsPanel
          inventory={inventory}
          purchaseOrders={purchaseOrders}
          inventoryCounts={inventoryCounts}
          onNavigateToTab={setActiveTab}
          onSelectItem={(item) => {
            setEditingItem(item);
            setItemFormOpen(true);
          }}
        />
      )}

      {/* KPIs */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold">{kpis.totalItems}</p>
                </div>
                <Package className="h-8 w-8 text-primary opacity-50" />
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
                <DollarSign className="h-8 w-8 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className={kpis.belowParItems > 0 ? 'border-yellow-500' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bajo Par Level</p>
                  <p className="text-2xl font-bold text-yellow-600">{kpis.belowParItems}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-yellow-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className={kpis.expiringItems > 0 ? 'border-orange-500' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Por Vencer</p>
                  <p className="text-2xl font-bold text-orange-600">{kpis.expiringItems}</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className={kpis.outOfStockItems > 0 ? 'border-red-500' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Agotados</p>
                  <p className="text-2xl font-bold text-red-600">{kpis.outOfStockItems}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick stats row */}
      {kpis && (
        <div className="flex gap-4 text-sm">
          <Badge variant="outline" className="gap-1">
            <ClipboardList className="h-3 w-3" />
            {kpis.pendingOrders} OC pendientes
          </Badge>
          <Badge variant="outline" className="gap-1">
            <ClipboardCheck className="h-3 w-3" />
            {kpis.openCounts} conteos abiertos
          </Badge>
          <Badge variant="outline" className="gap-1 text-red-600">
            <Trash2 className="h-3 w-3" />
            ${kpis.wasteThisMonth.toLocaleString()} merma este mes
          </Badge>
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

      {/* Main tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex w-full overflow-x-auto">
          <TabsTrigger value="items" className="gap-1">
            <Package className="h-4 w-4" />
            <span className="hidden md:inline">Inventario</span>
          </TabsTrigger>
          <TabsTrigger value="locations" className="gap-1">
            <Warehouse className="h-4 w-4" />
            <span className="hidden md:inline">Ubicaciones</span>
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-1">
            <Truck className="h-4 w-4" />
            <span className="hidden md:inline">Proveedores</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-1">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden md:inline">Compras</span>
          </TabsTrigger>
          <TabsTrigger value="counts" className="gap-1">
            <ClipboardCheck className="h-4 w-4" />
            <span className="hidden md:inline">Conteos</span>
          </TabsTrigger>
          <TabsTrigger value="waste" className="gap-1">
            <Trash2 className="h-4 w-4" />
            <span className="hidden md:inline">Mermas</span>
          </TabsTrigger>
          <TabsTrigger value="expirations" className="gap-1">
            <Clock className="h-4 w-4" />
            <span className="hidden md:inline">Vencimientos</span>
          </TabsTrigger>
          <TabsTrigger value="recipes" className="gap-1">
            <ChefHat className="h-4 w-4" />
            <span className="hidden md:inline">Recetas</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-1">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden md:inline">Reportes</span>
          </TabsTrigger>
        </TabsList>

        {/* Inventory Items Tab */}
        <TabsContent value="items" className="mt-4">
          {!hasData ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Sin items de inventario</h3>
                <p className="text-muted-foreground mb-6">
                  Agrega tu primer ítem de inventario para comenzar.
                </p>
                <Button onClick={() => { setEditingItem(null); setItemFormOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Primer Ítem
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, categoría, código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Badge variant="outline">{filteredInventory.length} items</Badge>
              </div>

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
                    {filteredInventory.slice(0, 50).map((item) => {
                      const status = getStockStatus(item);
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.item_name}</p>
                              {(item.barcode || item.sku) && (
                                <p className="text-xs text-muted-foreground">
                                  {item.sku || item.barcode}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{item.category || '-'}</TableCell>
                          <TableCell>
                            {item.storage_location?.location_name || '-'}
                          </TableCell>
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
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            ${(item.unit_cost || 0).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleViewDetail(item)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive" 
                              onClick={() => handleDelete(item.id)}
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
            </div>
          )}
        </TabsContent>

        {/* Storage Locations Tab */}
        <TabsContent value="locations" className="mt-4">
          <StorageLocationsManager
            locations={storageLocations}
            onCreate={createStorageLocation}
            onUpdate={updateStorageLocation}
            onDelete={deleteStorageLocation}
          />
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="mt-4">
          <SuppliersManager
            suppliers={suppliers}
            onCreate={createSupplier}
            onUpdate={updateSupplier}
            onDelete={deleteSupplier}
          />
        </TabsContent>

        {/* Purchase Orders Tab */}
        <TabsContent value="orders" className="mt-4">
          <PurchaseOrdersManager
            orders={purchaseOrders}
            suppliers={suppliers}
            inventory={inventory}
            onCreate={createPurchaseOrder}
            onUpdate={updatePurchaseOrder}
            onReceive={receivePurchaseOrder}
            onGenerateFromPar={generatePOFromParLevels}
          />
        </TabsContent>

        {/* Inventory Counts Tab */}
        <TabsContent value="counts" className="mt-4">
          <InventoryCountsManager
            counts={inventoryCounts}
            locations={storageLocations}
            inventory={inventory}
            onCreate={createInventoryCount}
            onComplete={completeCount}
            onUpdateItem={async (countId, itemId, qty, notes) => {
              // Simple update - the hook will handle the rest
              await supabase
                .from('inventory_count_items')
                .update({ 
                  counted_quantity: qty, 
                  notes,
                  counted_at: new Date().toISOString()
                })
                .eq('id', itemId);
              refetch();
            }}
            onLookupBarcode={lookupByBarcode}
          />
        </TabsContent>

        {/* Waste Tab */}
        <TabsContent value="waste" className="mt-4">
          <WasteTracker
            waste={waste}
            inventory={inventory}
            locations={storageLocations}
            onRecord={recordWaste}
            wasteThisMonth={kpis?.wasteThisMonth || 0}
          />
        </TabsContent>

        {/* Expirations Tab */}
        <TabsContent value="expirations" className="mt-4">
          <ExpirationTracker
            inventory={inventory}
            locations={storageLocations}
            onRecordWaste={recordWaste}
          />
        </TabsContent>

        {/* Recipes Integration Tab */}
        <TabsContent value="recipes" className="mt-4">
          <RecipeIntegrationPanel inventory={inventory} />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="mt-4">
          <InventoryReports
            inventory={inventory}
            locations={storageLocations}
            waste={waste}
          />
        </TabsContent>
      </Tabs>

      {/* Barcode Scanner Dialog */}
      <BarcodeScanner
        inventory={inventory}
        onLookup={lookupByBarcode}
        onAdjustStock={adjustStock}
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
      />

      {/* Inventory Item Form Dialog */}
      <InventoryItemForm
        isOpen={itemFormOpen}
        onClose={() => { setItemFormOpen(false); setEditingItem(null); }}
        item={editingItem}
        locations={storageLocations}
        suppliers={suppliers}
        onCreate={createInventoryItem}
        onUpdate={updateInventoryItem}
      />

      {/* Transfer Dialog */}
      <TransferDialog
        isOpen={transferDialogOpen}
        onClose={() => setTransferDialogOpen(false)}
        inventory={inventory}
        locations={storageLocations}
        onTransfer={transferInventory}
      />

      {/* Item Detail Sheet */}
      <InventoryItemDetail
        item={detailItem}
        isOpen={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailItem(null); }}
        onEdit={(item) => {
          setDetailOpen(false);
          handleEdit(item);
        }}
        getMovements={getItemMovements}
        getPriceHistory={getPriceHistory}
        suppliers={suppliers}
      />
    </div>
  );
};

export default Inventory;
