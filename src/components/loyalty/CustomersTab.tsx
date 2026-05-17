import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Search, Plus, Users } from 'lucide-react';
import { CustomerCard } from '@/components/loyalty/LoyaltyCards';
import type { LoyaltyCustomer } from '@/hooks/useLoyaltyData';

interface CustomersTabProps {
  customers: LoyaltyCustomer[];
  searchTerm: string;
  onSearchChange: (v: string) => void;
  onNewCustomer: () => void;
  onAwardPoints: (c: LoyaltyCustomer) => void;
  onShowQR: (c: LoyaltyCustomer) => void;
}

export const CustomersTab = ({
  customers,
  searchTerm,
  onSearchChange,
  onNewCustomer,
  onAwardPoints,
  onShowQR,
}: CustomersTabProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={onNewCustomer}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo Cliente
        </Button>
      </div>

      {customers.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="Sin clientes en el programa"
          description="Registra tu primer cliente para comenzar a construir lealtad"
          actionLabel="Agregar Cliente"
          onAction={onNewCustomer}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onViewDetails={() => {}}
              onAwardPoints={() => onAwardPoints(customer)}
              onShowQR={() => onShowQR(customer)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
