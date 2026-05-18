export const SUPPLIER_CATEGORIES = [
  'Carnes y Proteínas',
  'Frutas y Verduras',
  'Lácteos',
  'Pescados y Mariscos',
  'Bebidas',
  'Abarrotes',
  'Panadería',
  'Equipamiento',
  'Limpieza',
  'Empaques',
  'Otros',
] as const;

import { InventorySupplier } from '@/hooks/useEnterpriseInventory';

export const getSupplierCategory = (supplier: InventorySupplier): string => {
  if (supplier.notes?.startsWith('[')) {
    const match = supplier.notes.match(/^\[([^\]]+)\]/);
    return match ? match[1] : 'Otros';
  }
  return 'Otros';
};
