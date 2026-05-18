export const deliveryStatusLabels: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'En Preparación',
  ready: 'En Camino',
  delivered: 'Entregado',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

export const getDeliveryStatusLabel = (status: string) =>
  deliveryStatusLabels[status] || status;

export const getDeliveryStatusVariant = (
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'secondary',
    confirmed: 'default',
    preparing: 'default',
    ready: 'default',
    delivered: 'default',
    completed: 'default',
    cancelled: 'destructive',
  };
  return variants[status] || 'default';
};
