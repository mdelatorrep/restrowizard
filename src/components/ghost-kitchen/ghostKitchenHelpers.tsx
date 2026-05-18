import { Badge } from '@/components/ui/badge';

export const getProductionStatusBadge = (status: string) => {
  switch (status) {
    case 'cooking': return <Badge className="bg-orange-500">Cocinando</Badge>;
    case 'preparing': return <Badge className="bg-blue-500">Preparando</Badge>;
    case 'pending': return <Badge variant="outline">Pendiente</Badge>;
    case 'ready': return <Badge className="bg-green-500">Listo</Badge>;
    default: return <Badge variant="secondary">{status}</Badge>;
  }
};

export interface DisplayBrand {
  id: string;
  name: string;
  logo: string;
  status: 'active' | 'paused';
  orders_today: number;
  revenue_today: number;
  avg_prep_time: number;
  rating: number;
  cuisine: string;
}
