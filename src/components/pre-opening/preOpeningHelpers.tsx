import React from 'react';
import {
  ChefHat, Users, Megaphone, ClipboardCheck, Package, Utensils, Truck,
  Globe, Palette, FileText, Calendar, DollarSign, BookOpen,
} from 'lucide-react';
import { PreOpeningTask } from '@/hooks/usePreOpeningTasks';

export interface ModuleAction {
  path: string;
  label: string;
  icon: React.ElementType;
}

export const getTaskModuleAction = (task: PreOpeningTask): ModuleAction | null => {
  const titleLower = task.title.toLowerCase();
  const descLower = (task.description || '').toLowerCase();
  const phase = task.phase.toLowerCase();

  if (titleLower.includes('personal') || titleLower.includes('empleado') ||
      titleLower.includes('contratar') || titleLower.includes('capacita') ||
      titleLower.includes('equipo') || phase === 'staffing' || phase === 'staffing_plan' ||
      titleLower.includes('staff') || descLower.includes('personal')) {
    return { path: '/r/talent', label: 'Gestionar Equipo', icon: Users };
  }
  if (titleLower.includes('proveedor') || titleLower.includes('supplier') ||
      phase === 'suppliers' || phase === 'supplier_network' ||
      titleLower.includes('insumo') || titleLower.includes('compra')) {
    return { path: '/r/suppliers', label: 'Gestionar Proveedores', icon: Truck };
  }
  if (titleLower.includes('inventario') || titleLower.includes('stock') ||
      titleLower.includes('almacén') || descLower.includes('ingredientes')) {
    return { path: '/r/inventory', label: 'Gestionar Inventario', icon: Package };
  }
  if (titleLower.includes('menú') || titleLower.includes('menu') ||
      titleLower.includes('receta') || titleLower.includes('plato') ||
      titleLower.includes('carta') || descLower.includes('menú')) {
    return { path: '/r/menus', label: 'Crear Menú', icon: Utensils };
  }
  if (titleLower.includes('receta') || titleLower.includes('recipe') ||
      descLower.includes('receta')) {
    return { path: '/r/recipes', label: 'Crear Recetas', icon: BookOpen };
  }
  if (titleLower.includes('marketing') || titleLower.includes('redes') ||
      titleLower.includes('social') || titleLower.includes('publicidad') ||
      titleLower.includes('prensa') || phase === 'marketing' || phase === 'marketing_launch' ||
      titleLower.includes('promoción') || titleLower.includes('anuncio')) {
    return { path: '/r/website', label: 'Configurar Marketing', icon: Globe };
  }
  if (titleLower.includes('marca') || titleLower.includes('logo') ||
      titleLower.includes('identidad') || titleLower.includes('brand') ||
      titleLower.includes('diseño')) {
    return { path: '/r/brand', label: 'Configurar Marca', icon: Palette };
  }
  if (titleLower.includes('permiso') || titleLower.includes('licencia') ||
      titleLower.includes('legal') || titleLower.includes('sanitari') ||
      phase === 'legal' || phase === 'legal_requirements' ||
      titleLower.includes('registro') || titleLower.includes('bombero')) {
    return { path: '/r/new-business', label: 'Ver Requisitos', icon: FileText };
  }
  if (titleLower.includes('equipo') || titleLower.includes('equipment') ||
      phase === 'equipment' || phase === 'equipment_setup' ||
      titleLower.includes('cocina') || titleLower.includes('maquinaria')) {
    return { path: '/r/inventory', label: 'Registrar Equipos', icon: Package };
  }
  if (titleLower.includes('financi') || titleLower.includes('presupuesto') ||
      titleLower.includes('costo') || titleLower.includes('precio') ||
      phase === 'financial_projection') {
    return { path: '/r/finances', label: 'Ver Finanzas', icon: DollarSign };
  }
  if (titleLower.includes('reserva') || titleLower.includes('soft opening') ||
      titleLower.includes('invitacion')) {
    return { path: '/r/reservations', label: 'Gestionar Reservas', icon: Calendar };
  }
  if (task.category === 'operations') {
    return { path: '/r/operations', label: 'Ver Operaciones', icon: ChefHat };
  }
  return null;
};

export const getCategoryIcon = (category: PreOpeningTask['category']) => {
  switch (category) {
    case 'operations': return ChefHat;
    case 'marketing': return Megaphone;
    case 'team': return Users;
    case 'legal': return ClipboardCheck;
    default: return ClipboardCheck;
  }
};

export const getCategoryColor = (category: PreOpeningTask['category']) => {
  switch (category) {
    case 'operations': return 'bg-primary/10 text-primary';
    case 'marketing': return 'bg-info/10 text-info';
    case 'team': return 'bg-warning/10 text-warning';
    case 'legal': return 'bg-destructive/10 text-destructive';
    default: return 'bg-muted text-muted-foreground';
  }
};
