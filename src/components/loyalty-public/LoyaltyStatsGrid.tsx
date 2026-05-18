import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Coins, Trophy } from 'lucide-react';
import type { LoyaltyCustomer } from './loyaltyTypes';

export const LoyaltyStatsGrid = ({ customer }: { customer: LoyaltyCustomer }) => (
  <div className="grid grid-cols-3 gap-3">
    <Card><CardContent className="p-4 text-center">
      <TrendingUp className="w-5 h-5 mx-auto mb-1 text-primary" />
      <p className="text-lg font-bold">{customer.total_orders}</p>
      <p className="text-xs text-muted-foreground">Órdenes</p>
    </CardContent></Card>
    <Card><CardContent className="p-4 text-center">
      <Coins className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
      <p className="text-lg font-bold">{customer.lifetime_points.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground">Pts totales</p>
    </CardContent></Card>
    <Card><CardContent className="p-4 text-center">
      <Trophy className="w-5 h-5 mx-auto mb-1 text-orange-500" />
      <p className="text-lg font-bold">${customer.total_spent.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground">Total</p>
    </CardContent></Card>
  </div>
);
