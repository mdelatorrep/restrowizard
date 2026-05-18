import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift } from 'lucide-react';

interface LoyaltyStats {
  totalMembers: number;
  vipMembers: number;
  regularMembers: number;
  occasionalMembers: number;
}

interface Props {
  loyaltyStats: LoyaltyStats;
}

export const LoyaltyDistributionCard: React.FC<Props> = ({ loyaltyStats }) => {
  const data = {
    labels: ['VIP', 'Regulares', 'Ocasionales'],
    datasets: [{
      data: [
        loyaltyStats?.vipMembers || 0,
        loyaltyStats?.regularMembers || 0,
        loyaltyStats?.occasionalMembers || 0,
      ],
      backgroundColor: [
        'hsl(var(--primary))',
        'hsl(var(--secondary))',
        'hsl(var(--accent))',
      ],
    }],
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Gift className="mr-2 text-primary" />
          Programa de Lealtad
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loyaltyStats ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-bold">{loyaltyStats.vipMembers || 0}</p>
                <p className="text-xs text-muted-foreground">VIP</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-bold">{loyaltyStats.regularMembers || 0}</p>
                <p className="text-xs text-muted-foreground">Regulares</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-bold">{loyaltyStats.occasionalMembers || 0}</p>
                <p className="text-xs text-muted-foreground">Ocasionales</p>
              </div>
            </div>
            <div className="h-48">
              <Doughnut
                data={data}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' as const } },
                }}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Sin datos de lealtad disponibles</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
