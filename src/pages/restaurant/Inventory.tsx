import React, { useState } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
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
import { InventoryItemsTab } from '@/components/inventory/InventoryItemsTab';
import { InventoryTabsBar } from '@/components/inventory/InventoryTabsBar';
import { InventoryKPIsBar } from '@/components/inventory/InventoryKPIsBar';
import { Package, Plus, Sparkles, Brain, Scan, MoveHorizontal } from 'lucide-react';
import { useEnterpriseInventory, InventoryItemExtended } from '@/hooks/useEnterpriseInventory';
import { useInventoryAI } from '@/hooks/useInventoryAI';
import { supabase } from '@/integrations/supabase/client';
import { ModulePageLayout, PageHeader } from '@/components/layout';

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

  // getStockStatus extracted to src/components/inventory/InventoryStockTable.tsx

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
     <ModulePageLayout>
       <PageHeader
         title="Gestión de Inventarios"
         description="Control enterprise de stock, proveedores y compras"
         icon={Package}
         actions={[
           { label: 'Transferir', icon: MoveHorizontal, onClick: () => setTransferDialogOpen(true), variant: 'outline' },
           { label: 'Escanear', icon: Scan, onClick: () => setScannerOpen(true), variant: 'outline' },
           { label: aiLoading ? 'Analizando...' : 'Análisis IA', icon: Sparkles, onClick: handleAIAnalysis, variant: 'outline', loading: aiLoading },
           { label: 'Nuevo Ítem', icon: Plus, onClick: () => { setEditingItem(null); setItemFormOpen(true); } }
         ]}
       />

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

      {/* KPIs + Quick stats */}
      <InventoryKPIsBar kpis={kpis} />

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
        <InventoryTabsBar />

        {/* Inventory Items Tab */}
        <TabsContent value="items" className="mt-4">
          <InventoryItemsTab
            hasData={hasData}
            items={filteredInventory}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onAdd={() => {
              setEditingItem(null);
              setItemFormOpen(true);
            }}
            onView={handleViewDetail}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
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
     </ModulePageLayout>
  );
};

export default Inventory;
