import { Card, CardContent } from '@/components/ui/card';
import { History } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PointsTransaction } from './loyaltyTypes';

export const LoyaltyHistoryTab = ({ transactions }: { transactions: PointsTransaction[] }) => (
  <div className="space-y-2 mt-4">
    {transactions.length === 0 ? (
      <Card><CardContent className="p-6 text-center">
        <History className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground">Sin transacciones aún</p>
      </CardContent></Card>
    ) : transactions.map(tx => (
      <Card key={tx.id}>
        <CardContent className="p-3 flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">{tx.description || 'Transacción'}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(tx.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <span className={cn('font-bold', tx.transaction_type === 'earn' ? 'text-green-600' : 'text-red-600')}>
            {tx.transaction_type === 'earn' ? '+' : '-'}{tx.points}
          </span>
        </CardContent>
      </Card>
    ))}
  </div>
);
