import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package, Warehouse, Truck, ClipboardList, ClipboardCheck,
  Trash2, Clock, ChefHat, BarChart3,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface TabDef {
  value: string;
  label: string;
  icon: LucideIcon;
}

const TABS: TabDef[] = [
  { value: 'items', label: 'Inventario', icon: Package },
  { value: 'locations', label: 'Ubicaciones', icon: Warehouse },
  { value: 'suppliers', label: 'Proveedores', icon: Truck },
  { value: 'orders', label: 'Compras', icon: ClipboardList },
  { value: 'counts', label: 'Conteos', icon: ClipboardCheck },
  { value: 'waste', label: 'Mermas', icon: Trash2 },
  { value: 'expirations', label: 'Vencimientos', icon: Clock },
  { value: 'recipes', label: 'Recetas', icon: ChefHat },
  { value: 'reports', label: 'Reportes', icon: BarChart3 },
];

export const InventoryTabsBar = () => (
  <TabsList className="flex w-full overflow-x-auto">
    {TABS.map(({ value, label, icon: Icon }) => (
      <TabsTrigger key={value} value={value} className="gap-1">
        <Icon className="h-4 w-4" />
        <span className="hidden md:inline">{label}</span>
      </TabsTrigger>
    ))}
  </TabsList>
);
