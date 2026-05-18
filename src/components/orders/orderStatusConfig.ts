import { Clock, ChefHat, Truck, CheckCircle, XCircle } from 'lucide-react';
import type React from 'react';

export interface OrderStatusConfig {
  label: string;
  color: string;
  icon: React.ElementType;
}

export const orderStatusConfig: Record<string, OrderStatusConfig> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  preparing: { label: 'Preparando', color: 'bg-orange-100 text-orange-800', icon: ChefHat },
  ready: { label: 'Listo', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  delivering: { label: 'En Camino', color: 'bg-purple-100 text-purple-800', icon: Truck },
  completed: { label: 'Completado', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export const ORDER_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'preparing', label: 'Preparando' },
  { value: 'ready', label: 'Listo' },
  { value: 'delivering', label: 'En Camino' },
  { value: 'completed', label: 'Completado' },
  { value: 'cancelled', label: 'Cancelado' },
];
