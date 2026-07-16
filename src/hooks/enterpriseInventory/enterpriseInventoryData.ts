import { supabase } from '@/integrations/supabase/client';

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


export interface EnterpriseInventoryData {
  inventory: InventoryItemExtended[];
  storageLocations: StorageLocation[];
  suppliers: InventorySupplier[];
  purchaseOrders: PurchaseOrder[];
  inventoryCounts: InventoryCount[];
  movements: InventoryMovement[];
  waste: InventoryWaste[];
  kpis: EnterpriseInventoryKPIs;
}

export const computeInventoryKPIs = (
  items: InventoryItemExtended[],
  orders: PurchaseOrder[],
  counts: InventoryCount[],
  wasteRows: InventoryWaste[],
  now: Date = new Date()
): EnterpriseInventoryKPIs => {
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalValue = items.reduce((sum, item) =>
    sum + (item.current_stock * Number(item.unit_cost || 0)), 0);

  const lowStock = items.filter(item =>
    item.reorder_point && item.current_stock <= Number(item.reorder_point) && item.current_stock > 0).length;

  const outOfStock = items.filter(item => item.current_stock <= 0).length;

  const expiringItems = items.filter(item => {
    if (!item.expiration_date) return false;
    const daysUntil = Math.ceil((new Date(item.expiration_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil > 0 && daysUntil <= 7;
  }).length;

  const expiredItems = items.filter(item =>
    item.expiration_date ? new Date(item.expiration_date) < now : false).length;

  const belowPar = items.filter(item =>
    item.par_level > 0 && item.current_stock < item.par_level).length;

  const pendingOrders = orders.filter(o => ['draft', 'sent', 'partial'].includes(o.status)).length;
  const openCounts = counts.filter(c => c.status === 'in_progress').length;
  const monthWaste = wasteRows
    .filter(w => new Date(w.waste_date) >= startOfMonth)
    .reduce((sum, w) => sum + Number(w.total_cost || 0), 0);

  return {
    totalItems: items.length,
    totalValue,
    lowStockItems: lowStock,
    outOfStockItems: outOfStock,
    expiringItems,
    expiredItems,
    belowParItems: belowPar,
    pendingOrders,
    openCounts,
    wasteThisMonth: monthWaste,
  };
};

/** Carga del inventario enterprise (B-31: extraído del hook). */
export const fetchEnterpriseInventoryData = async (userId: string): Promise<EnterpriseInventoryData> => {
  const [inventoryRes, locationsRes, suppliersRes, ordersRes, countsRes, movementsRes, wasteRes] = await Promise.all([
    supabase.from('inventory_items').select('*').eq('user_id', userId).order('item_name'),
    supabase.from('storage_locations').select('*').eq('user_id', userId).order('sort_order'),
    supabase.from('inventory_suppliers').select('*').eq('user_id', userId).order('supplier_name'),
    supabase.from('purchase_orders').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
    supabase.from('inventory_counts').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
    supabase.from('inventory_movements').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(100),
    supabase.from('inventory_waste').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
  ]);

  if (inventoryRes.error) throw inventoryRes.error;
  if (locationsRes.error) throw locationsRes.error;
  if (suppliersRes.error) throw suppliersRes.error;
  if (ordersRes.error) throw ordersRes.error;
  if (countsRes.error) throw countsRes.error;
  if (movementsRes.error) throw movementsRes.error;
  if (wasteRes.error) throw wasteRes.error;

  const items = (inventoryRes.data || []) as InventoryItemExtended[];
  const storageLocations = (locationsRes.data || []) as StorageLocation[];
  const suppliers = (suppliersRes.data || []) as InventorySupplier[];
  const purchaseOrders = (ordersRes.data || []) as PurchaseOrder[];
  const inventoryCounts = (countsRes.data || []) as InventoryCount[];
  const waste = (wasteRes.data || []) as InventoryWaste[];

  // Enrich inventory with relations
  const inventory = items.map(item => ({
    ...item,
    storage_location: storageLocations.find(l => l.id === item.storage_location_id),
    preferred_supplier: suppliers.find(s => s.id === item.preferred_supplier_id),
  }));

  return {
    inventory,
    storageLocations,
    suppliers,
    purchaseOrders,
    inventoryCounts,
    movements: (movementsRes.data || []) as InventoryMovement[],
    waste,
    kpis: computeInventoryKPIs(items, purchaseOrders, inventoryCounts, waste),
  };
};
