import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';
import { useToast } from './use-toast';

// Types
export interface StorageLocation {
  id: string;
  user_id: string;
  location_name: string;
  location_type: string;
  temperature_range: string | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface InventorySupplier {
  id: string;
  user_id: string;
  supplier_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  payment_terms: string | null;
  minimum_order: number | null;
  delivery_days: string | null;
  lead_time_days: number;
  notes: string | null;
  is_active: boolean;
  rating: number | null;
}

export interface InventoryItemExtended {
  id: string;
  user_id: string;
  item_name: string;
  category: string | null;
  current_stock: number;
  unit: string;
  unit_cost: number | null;
  reorder_point: number | null;
  supplier_name: string | null;
  last_restocked_at: string | null;
  storage_location_id: string | null;
  par_level: number;
  max_level: number | null;
  expiration_date: string | null;
  lot_number: string | null;
  barcode: string | null;
  sku: string | null;
  purchase_unit: string | null;
  purchase_quantity: number;
  min_order_quantity: number;
  lead_time_days: number;
  is_perishable: boolean;
  shelf_life_days: number | null;
  preferred_supplier_id: string | null;
  notes: string | null;
  storage_location?: StorageLocation;
  preferred_supplier?: InventorySupplier;
}

export interface PurchaseOrder {
  id: string;
  user_id: string;
  supplier_id: string | null;
  order_number: string;
  status: string;
  order_date: string;
  expected_delivery: string | null;
  received_date: string | null;
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  notes: string | null;
  internal_notes: string | null;
  created_by: string | null;
  received_by: string | null;
  supplier?: InventorySupplier;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  inventory_item_id: string;
  quantity_ordered: number;
  quantity_received: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  lot_number: string | null;
  expiration_date: string | null;
  notes: string | null;
  inventory_item?: InventoryItemExtended;
}

export interface InventoryCount {
  id: string;
  user_id: string;
  count_name: string;
  count_type: string;
  status: string;
  storage_location_id: string | null;
  scheduled_date: string | null;
  started_at: string;
  completed_at: string | null;
  counted_by: string | null;
  verified_by: string | null;
  total_items: number;
  items_counted: number;
  total_variance_value: number;
  notes: string | null;
  storage_location?: StorageLocation;
  items?: InventoryCountItem[];
}

export interface InventoryCountItem {
  id: string;
  count_id: string;
  inventory_item_id: string;
  system_quantity: number;
  counted_quantity: number | null;
  variance_quantity: number | null;
  variance_value: number | null;
  variance_percentage: number | null;
  unit_cost: number | null;
  notes: string | null;
  counted_at: string | null;
  inventory_item?: InventoryItemExtended;
}

export interface InventoryMovement {
  id: string;
  user_id: string;
  inventory_item_id: string;
  movement_type: string;
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  unit_cost: number | null;
  total_cost: number | null;
  reference_type: string | null;
  reference_id: string | null;
  from_location_id: string | null;
  to_location_id: string | null;
  lot_number: string | null;
  expiration_date: string | null;
  notes: string | null;
  performed_by: string | null;
  created_at: string;
  inventory_item?: InventoryItemExtended;
}

export interface InventoryWaste {
  id: string;
  user_id: string;
  inventory_item_id: string;
  waste_date: string;
  quantity: number;
  unit: string;
  unit_cost: number | null;
  total_cost: number | null;
  waste_reason: string;
  is_preventable: boolean;
  lot_number: string | null;
  storage_location_id: string | null;
  notes: string | null;
  reported_by: string | null;
  inventory_item?: InventoryItemExtended;
}

export interface PriceHistory {
  id: string;
  inventory_item_id: string;
  supplier_id: string | null;
  old_price: number | null;
  new_price: number;
  change_percentage: number | null;
  change_reason: string | null;
  recorded_at: string;
}

export interface EnterpriseInventoryKPIs {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  expiringItems: number;
  expiredItems: number;
  belowParItems: number;
  pendingOrders: number;
  openCounts: number;
  wasteThisMonth: number;
}

export const useEnterpriseInventory = () => {
  const { userId, isViewingClient } = useDataUserId();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<InventoryItemExtended[]>([]);
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([]);
  const [suppliers, setSuppliers] = useState<InventorySupplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [inventoryCounts, setInventoryCounts] = useState<InventoryCount[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [waste, setWaste] = useState<InventoryWaste[]>([]);
  const [kpis, setKpis] = useState<EnterpriseInventoryKPIs | null>(null);

  // Fetch all data
  const fetchAll = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const [
        inventoryRes,
        locationsRes,
        suppliersRes,
        ordersRes,
        countsRes,
        movementsRes,
        wasteRes
      ] = await Promise.all([
        supabase.from('inventory_items').select('*').eq('user_id', userId).order('item_name'),
        supabase.from('storage_locations').select('*').eq('user_id', userId).order('sort_order'),
        supabase.from('inventory_suppliers').select('*').eq('user_id', userId).order('supplier_name'),
        supabase.from('purchase_orders').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
        supabase.from('inventory_counts').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
        supabase.from('inventory_movements').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(100),
        supabase.from('inventory_waste').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50)
      ]);

      if (inventoryRes.error) throw inventoryRes.error;
      if (locationsRes.error) throw locationsRes.error;
      if (suppliersRes.error) throw suppliersRes.error;
      if (ordersRes.error) throw ordersRes.error;
      if (countsRes.error) throw countsRes.error;
      if (movementsRes.error) throw movementsRes.error;
      if (wasteRes.error) throw wasteRes.error;

      const items = (inventoryRes.data || []) as InventoryItemExtended[];
      const locations = (locationsRes.data || []) as StorageLocation[];
      const suppliersList = (suppliersRes.data || []) as InventorySupplier[];
      
      // Enrich inventory with relations
      const enrichedItems = items.map(item => ({
        ...item,
        storage_location: locations.find(l => l.id === item.storage_location_id),
        preferred_supplier: suppliersList.find(s => s.id === item.preferred_supplier_id)
      }));

      setInventory(enrichedItems);
      setStorageLocations(locations);
      setSuppliers(suppliersList);
      setPurchaseOrders((ordersRes.data || []) as PurchaseOrder[]);
      setInventoryCounts((countsRes.data || []) as InventoryCount[]);
      setMovements((movementsRes.data || []) as InventoryMovement[]);
      setWaste((wasteRes.data || []) as InventoryWaste[]);

      // Calculate KPIs
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const totalValue = items.reduce((sum, item) => 
        sum + (item.current_stock * Number(item.unit_cost || 0)), 0);

      const lowStock = items.filter(item => 
        item.reorder_point && item.current_stock <= Number(item.reorder_point) && item.current_stock > 0).length;

      const outOfStock = items.filter(item => item.current_stock <= 0).length;

      const expiringItems = items.filter(item => {
        if (!item.expiration_date) return false;
        const expDate = new Date(item.expiration_date);
        const daysUntil = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntil > 0 && daysUntil <= 7;
      }).length;

      const expiredItems = items.filter(item => {
        if (!item.expiration_date) return false;
        return new Date(item.expiration_date) < now;
      }).length;

      const belowPar = items.filter(item => 
        item.par_level > 0 && item.current_stock < item.par_level).length;

      const pendingOrders = (ordersRes.data || []).filter((o: PurchaseOrder) => 
        ['draft', 'sent', 'partial'].includes(o.status)).length;

      const openCounts = (countsRes.data || []).filter((c: InventoryCount) => 
        c.status === 'in_progress').length;

      const monthWaste = (wasteRes.data || []).filter((w: InventoryWaste) => 
        new Date(w.waste_date) >= startOfMonth
      ).reduce((sum, w) => sum + Number(w.total_cost || 0), 0);

      setKpis({
        totalItems: items.length,
        totalValue,
        lowStockItems: lowStock,
        outOfStockItems: outOfStock,
        expiringItems,
        expiredItems,
        belowParItems: belowPar,
        pendingOrders,
        openCounts,
        wasteThisMonth: monthWaste
      });

    } catch (error: any) {
      console.error('Error fetching enterprise inventory:', error);
      toast({
        title: "Error al cargar inventario",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  // Storage Locations CRUD
  const createStorageLocation = async (data: Partial<StorageLocation>) => {
    if (!userId) return null;
    try {
      const insertData = {
        location_name: data.location_name || 'Nueva ubicación',
        location_type: data.location_type || 'dry_storage',
        temperature_range: data.temperature_range,
        description: data.description,
        is_active: data.is_active ?? true,
        sort_order: data.sort_order || 0,
        user_id: userId
      };
      const { data: result, error } = await supabase
        .from('storage_locations')
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      toast({ title: "Ubicación creada" });
      await fetchAll();
      return result;
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return null;
    }
  };

  const updateStorageLocation = async (id: string, data: Partial<StorageLocation>) => {
    try {
      const { error } = await supabase
        .from('storage_locations')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      toast({ title: "Ubicación actualizada" });
      await fetchAll();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const deleteStorageLocation = async (id: string) => {
    try {
      const { error } = await supabase.from('storage_locations').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Ubicación eliminada" });
      await fetchAll();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Suppliers CRUD
  const createSupplier = async (data: Partial<InventorySupplier>) => {
    if (!userId) return null;
    try {
      const insertData = {
        supplier_name: data.supplier_name || 'Nuevo proveedor',
        contact_name: data.contact_name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        payment_terms: data.payment_terms,
        minimum_order: data.minimum_order,
        delivery_days: data.delivery_days,
        lead_time_days: data.lead_time_days || 1,
        notes: data.notes,
        is_active: data.is_active ?? true,
        rating: data.rating,
        user_id: userId
      };
      const { data: result, error } = await supabase
        .from('inventory_suppliers')
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      toast({ title: "Proveedor creado" });
      await fetchAll();
      return result;
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return null;
    }
  };

  const updateSupplier = async (id: string, data: Partial<InventorySupplier>) => {
    try {
      const { error } = await supabase
        .from('inventory_suppliers')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      toast({ title: "Proveedor actualizado" });
      await fetchAll();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      const { error } = await supabase.from('inventory_suppliers').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Proveedor eliminado" });
      await fetchAll();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Inventory Items (extended)
  const createInventoryItem = async (data: Partial<InventoryItemExtended>) => {
    if (!userId) return null;
    try {
      const insertData = {
        item_name: data.item_name || 'Nuevo ítem',
        category: data.category,
        current_stock: data.current_stock || 0,
        unit: data.unit || 'unidades',
        unit_cost: data.unit_cost,
        reorder_point: data.reorder_point,
        supplier_name: data.supplier_name,
        storage_location_id: data.storage_location_id,
        par_level: data.par_level || 0,
        max_level: data.max_level,
        expiration_date: data.expiration_date,
        lot_number: data.lot_number,
        barcode: data.barcode,
        sku: data.sku,
        purchase_unit: data.purchase_unit,
        purchase_quantity: data.purchase_quantity || 1,
        min_order_quantity: data.min_order_quantity || 1,
        lead_time_days: data.lead_time_days || 1,
        is_perishable: data.is_perishable || false,
        shelf_life_days: data.shelf_life_days,
        preferred_supplier_id: data.preferred_supplier_id,
        notes: data.notes,
        user_id: userId
      };
      const { data: result, error } = await supabase
        .from('inventory_items')
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      toast({ title: "Ítem creado" });
      // Optimistic update so the list refreshes immediately, even if the
      // subsequent SELECT is filtered out by RLS/user_id mismatch edge cases.
      if (result) {
        const enriched = {
          ...(result as InventoryItemExtended),
          storage_location: storageLocations.find(l => l.id === (result as any).storage_location_id),
          preferred_supplier: suppliers.find(s => s.id === (result as any).preferred_supplier_id),
        };
        setInventory(prev => [enriched, ...prev]);
      }
      await fetchAll();
      return result;
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return null;
    }
  };

  const updateInventoryItem = async (id: string, data: Partial<InventoryItemExtended>) => {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .update(data)
        .eq('id', id);
      if (error) throw error;
      toast({ title: "Ítem actualizado" });
      await fetchAll();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const deleteInventoryItem = async (id: string) => {
    try {
      const { error } = await supabase.from('inventory_items').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Ítem eliminado" });
      await fetchAll();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Purchase Orders
  const createPurchaseOrder = async (data: Partial<PurchaseOrder>, items: Partial<PurchaseOrderItem>[]) => {
    if (!userId) return null;
    try {
      const orderInsert = {
        order_number: data.order_number || '',
        supplier_id: data.supplier_id,
        status: data.status || 'draft',
        order_date: data.order_date || new Date().toISOString().split('T')[0],
        expected_delivery: data.expected_delivery,
        subtotal: data.subtotal || 0,
        tax_amount: data.tax_amount || 0,
        shipping_cost: data.shipping_cost || 0,
        total_amount: data.total_amount || 0,
        notes: data.notes,
        internal_notes: data.internal_notes,
        created_by: data.created_by,
        user_id: userId
      };
      const { data: order, error: orderError } = await supabase
        .from('purchase_orders')
        .insert(orderInsert)
        .select()
        .single();
      if (orderError) throw orderError;

      if (items.length > 0) {
        const orderItems = items.map(item => ({
          purchase_order_id: order.id,
          inventory_item_id: item.inventory_item_id!,
          quantity_ordered: item.quantity_ordered || 0,
          quantity_received: item.quantity_received || 0,
          unit: item.unit || 'unidades',
          unit_cost: item.unit_cost || 0,
          total_cost: item.total_cost || 0,
          lot_number: item.lot_number,
          expiration_date: item.expiration_date,
          notes: item.notes
        }));
        const { error: itemsError } = await supabase
          .from('purchase_order_items')
          .insert(orderItems);
        if (itemsError) throw itemsError;
      }

      toast({ title: "Orden de compra creada", description: `#${order.order_number}` });
      await fetchAll();
      return order;
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return null;
    }
  };

  const updatePurchaseOrder = async (id: string, data: Partial<PurchaseOrder>) => {
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      toast({ title: "Orden actualizada" });
      await fetchAll();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const receivePurchaseOrder = async (orderId: string, receivedItems: { id: string; quantity_received: number; lot_number?: string; expiration_date?: string }[]) => {
    try {
      // Update each PO item
      for (const item of receivedItems) {
        await supabase
          .from('purchase_order_items')
          .update({ 
            quantity_received: item.quantity_received,
            lot_number: item.lot_number,
            expiration_date: item.expiration_date
          })
          .eq('id', item.id);
      }

      // Get PO items to update inventory
      const { data: poItems } = await supabase
        .from('purchase_order_items')
        .select('*, inventory_items(*)')
        .eq('purchase_order_id', orderId);

      // Update inventory quantities
      if (poItems) {
        for (const poItem of poItems) {
          const receivedInfo = receivedItems.find(r => r.id === poItem.id);
          if (receivedInfo && receivedInfo.quantity_received > 0) {
            await supabase
              .from('inventory_items')
              .update({
                current_stock: (poItem.inventory_items?.current_stock || 0) + receivedInfo.quantity_received,
                last_restocked_at: new Date().toISOString(),
                lot_number: receivedInfo.lot_number,
                expiration_date: receivedInfo.expiration_date
              })
              .eq('id', poItem.inventory_item_id);
          }
        }
      }

      // Check if order is fully received
      const { data: allItems } = await supabase
        .from('purchase_order_items')
        .select('quantity_ordered, quantity_received')
        .eq('purchase_order_id', orderId);

      const isFullyReceived = allItems?.every(i => i.quantity_received >= i.quantity_ordered);
      
      await supabase
        .from('purchase_orders')
        .update({ 
          status: isFullyReceived ? 'received' : 'partial',
          received_date: isFullyReceived ? new Date().toISOString().split('T')[0] : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      toast({ title: "Recepción registrada" });
      await fetchAll();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Inventory Counts
  const createInventoryCount = async (data: Partial<InventoryCount>, itemIds?: string[]) => {
    if (!userId) return null;
    try {
      const countInsert = {
        count_name: data.count_name || 'Conteo físico',
        count_type: data.count_type || 'full',
        status: data.status || 'in_progress',
        storage_location_id: data.storage_location_id,
        scheduled_date: data.scheduled_date,
        counted_by: data.counted_by,
        notes: data.notes,
        user_id: userId
      };
      const { data: count, error: countError } = await supabase
        .from('inventory_counts')
        .insert(countInsert)
        .select()
        .single();
      if (countError) throw countError;

      // Create count items from inventory
      const targetItems = itemIds?.length 
        ? inventory.filter(i => itemIds.includes(i.id))
        : data.storage_location_id 
          ? inventory.filter(i => i.storage_location_id === data.storage_location_id)
          : inventory;

      const countItems = targetItems.map(item => ({
        count_id: count.id,
        inventory_item_id: item.id,
        system_quantity: item.current_stock,
        unit_cost: item.unit_cost
      }));

      if (countItems.length > 0) {
        await supabase.from('inventory_count_items').insert(countItems);
        await supabase
          .from('inventory_counts')
          .update({ total_items: countItems.length })
          .eq('id', count.id);
      }

      toast({ title: "Conteo iniciado", description: `${countItems.length} ítems a contar` });
      await fetchAll();
      return count;
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return null;
    }
  };

  const updateCountItem = async (countId: string, itemId: string, countedQuantity: number, notes?: string) => {
    try {
      const { data: countItem } = await supabase
        .from('inventory_count_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (!countItem) throw new Error('Item not found');

      const variance = countedQuantity - countItem.system_quantity;
      const varianceValue = variance * (countItem.unit_cost || 0);
      const variancePercentage = countItem.system_quantity > 0 
        ? (variance / countItem.system_quantity) * 100 
        : 0;

      await supabase
        .from('inventory_count_items')
        .update({
          counted_quantity: countedQuantity,
          variance_quantity: variance,
          variance_value: varianceValue,
          variance_percentage: variancePercentage,
          notes,
          counted_at: new Date().toISOString()
        })
        .eq('id', itemId);

      // Update count progress
      const { data: allItems } = await supabase
        .from('inventory_count_items')
        .select('counted_quantity, variance_value')
        .eq('count_id', countId);

      const countedCount = allItems?.filter(i => i.counted_quantity !== null).length || 0;
      const totalVariance = allItems?.reduce((sum, i) => sum + Math.abs(i.variance_value || 0), 0) || 0;

      await supabase
        .from('inventory_counts')
        .update({
          items_counted: countedCount,
          total_variance_value: totalVariance
        })
        .eq('id', countId);

      await fetchAll();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const completeCount = async (countId: string, applyAdjustments: boolean) => {
    try {
      if (applyAdjustments) {
        // Get all count items
        const { data: countItems } = await supabase
          .from('inventory_count_items')
          .select('*')
          .eq('count_id', countId);

        // Update inventory with counted quantities
        if (countItems) {
          for (const item of countItems) {
            if (item.counted_quantity !== null) {
              await supabase
                .from('inventory_items')
                .update({ current_stock: item.counted_quantity })
                .eq('id', item.inventory_item_id);
            }
          }
        }
      }

      await supabase
        .from('inventory_counts')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', countId);

      toast({ title: "Conteo completado", description: applyAdjustments ? "Ajustes aplicados al inventario" : "Sin ajustes aplicados" });
      await fetchAll();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Waste tracking
  const recordWaste = async (data: Partial<InventoryWaste>) => {
    if (!userId) return null;
    try {
      const item = inventory.find(i => i.id === data.inventory_item_id);
      const totalCost = (data.quantity || 0) * (data.unit_cost || item?.unit_cost || 0);

      const wasteInsert = {
        inventory_item_id: data.inventory_item_id!,
        waste_date: data.waste_date || new Date().toISOString().split('T')[0],
        quantity: data.quantity || 0,
        unit: data.unit || item?.unit || 'unidades',
        unit_cost: data.unit_cost || item?.unit_cost,
        total_cost: totalCost,
        waste_reason: data.waste_reason || 'other',
        is_preventable: data.is_preventable || false,
        lot_number: data.lot_number,
        storage_location_id: data.storage_location_id,
        notes: data.notes,
        reported_by: data.reported_by,
        user_id: userId
      };
      const { data: result, error } = await supabase
        .from('inventory_waste')
        .insert(wasteInsert)
        .select()
        .single();
      if (error) throw error;

      // Deduct from inventory
      if (item) {
        await supabase
          .from('inventory_items')
          .update({ current_stock: Math.max(0, item.current_stock - (data.quantity || 0)) })
          .eq('id', data.inventory_item_id);
      }

      toast({ title: "Merma registrada" });
      await fetchAll();
      return result;
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return null;
    }
  };

  // Transfer between locations
  const transferInventory = async (itemId: string, fromLocationId: string | null, toLocationId: string, quantity: number, notes?: string) => {
    if (!userId) return;
    try {
      const item = inventory.find(i => i.id === itemId);
      if (!item) throw new Error('Item not found');

      // Record movement
      await supabase.from('inventory_movements').insert({
        user_id: userId,
        inventory_item_id: itemId,
        movement_type: 'transfer',
        quantity_change: 0,
        quantity_before: item.current_stock,
        quantity_after: item.current_stock,
        from_location_id: fromLocationId,
        to_location_id: toLocationId,
        notes
      });

      // Update item location
      await supabase
        .from('inventory_items')
        .update({ storage_location_id: toLocationId })
        .eq('id', itemId);

      toast({ title: "Transferencia completada" });
      await fetchAll();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Quick stock adjustment
  const adjustStock = async (itemId: string, newQuantity: number, reason: string) => {
    try {
      const item = inventory.find(i => i.id === itemId);
      if (!item) throw new Error('Item not found');

      await supabase
        .from('inventory_items')
        .update({ current_stock: newQuantity })
        .eq('id', itemId);

      // Movement is recorded automatically by trigger, but we can add notes
      await supabase.from('inventory_movements').insert({
        user_id: userId!,
        inventory_item_id: itemId,
        movement_type: 'adjustment',
        quantity_change: newQuantity - item.current_stock,
        quantity_before: item.current_stock,
        quantity_after: newQuantity,
        unit_cost: item.unit_cost,
        total_cost: (newQuantity - item.current_stock) * (item.unit_cost || 0),
        notes: reason
      });

      toast({ title: "Stock ajustado" });
      await fetchAll();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Generate PO from par levels
  const generatePOFromParLevels = async (supplierId?: string) => {
    const belowPar = inventory.filter(item => 
      item.par_level > 0 && 
      item.current_stock < item.par_level &&
      (!supplierId || item.preferred_supplier_id === supplierId)
    );

    if (belowPar.length === 0) {
      toast({ title: "Sin items bajo par", description: "No hay items que necesiten reorden" });
      return null;
    }

    const items: Partial<PurchaseOrderItem>[] = belowPar.map(item => ({
      inventory_item_id: item.id,
      quantity_ordered: Math.max(item.min_order_quantity, item.par_level - item.current_stock),
      unit: item.purchase_unit || item.unit,
      unit_cost: item.unit_cost || 0,
      total_cost: (item.unit_cost || 0) * Math.max(item.min_order_quantity, item.par_level - item.current_stock)
    }));

    const subtotal = items.reduce((sum, i) => sum + (i.total_cost || 0), 0);

    return createPurchaseOrder({
      supplier_id: supplierId || belowPar[0]?.preferred_supplier_id,
      status: 'draft',
      subtotal,
      total_amount: subtotal
    }, items);
  };

  // Barcode lookup
  const lookupByBarcode = (barcode: string) => {
    return inventory.find(item => item.barcode === barcode || item.sku === barcode);
  };

  // Get price history for item
  const getPriceHistory = async (itemId: string) => {
    const { data, error } = await supabase
      .from('inventory_price_history')
      .select('*')
      .eq('inventory_item_id', itemId)
      .order('recorded_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return data as PriceHistory[];
  };

  // Get movements for item
  const getItemMovements = async (itemId: string) => {
    const { data, error } = await supabase
      .from('inventory_movements')
      .select('*')
      .eq('inventory_item_id', itemId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data as InventoryMovement[];
  };

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    // State
    loading,
    inventory,
    storageLocations,
    suppliers,
    purchaseOrders,
    inventoryCounts,
    movements,
    waste,
    kpis,
    isViewingClient,
    hasData: inventory.length > 0,

    // Actions
    refetch: fetchAll,
    
    // Storage Locations
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
    transferInventory,
    lookupByBarcode,
    getPriceHistory,
    getItemMovements,
    
    // Purchase Orders
    createPurchaseOrder,
    updatePurchaseOrder,
    receivePurchaseOrder,
    generatePOFromParLevels,
    
    // Inventory Counts
    createInventoryCount,
    updateCountItem,
    completeCount,
    
    // Waste
    recordWaste
  };
};
