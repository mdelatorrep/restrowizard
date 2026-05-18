import { Card, CardContent } from '@/components/ui/card';
import { Package, CheckCircle, EyeOff, DollarSign } from 'lucide-react';

interface Props {
  stats: { totalItems: number; availableItems: number; unavailableItems: number; avgPrice: number };
}

export function MenuEditorStats({ stats }: Props) {
  const cards = [
    {
      label: 'Total Platillos',
      value: stats.totalItems,
      Icon: Package,
      iconWrap: 'from-primary/20 to-primary/10',
      iconColor: 'text-primary',
      valueClass: 'bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent',
    },
    {
      label: 'Disponibles',
      value: stats.availableItems,
      Icon: CheckCircle,
      iconWrap: 'from-green-500/20 to-green-500/10',
      iconColor: 'text-green-600',
      valueClass: 'text-green-600',
    },
    {
      label: 'Agotados',
      value: stats.unavailableItems,
      Icon: EyeOff,
      iconWrap: 'from-red-500/20 to-red-500/10',
      iconColor: 'text-red-600',
      valueClass: 'text-red-600',
    },
    {
      label: 'Precio Prom.',
      value: `$${stats.avgPrice.toFixed(2)}`,
      Icon: DollarSign,
      iconWrap: 'from-purple-500/20 to-purple-500/10',
      iconColor: 'text-purple-600',
      valueClass: 'text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {cards.map(({ label, value, Icon, iconWrap, iconColor, valueClass }) => (
        <Card
          key={label}
          className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-card to-muted/30 overflow-hidden"
        >
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
                <p className={`text-3xl font-bold ${valueClass}`}>{value}</p>
              </div>
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${iconWrap} flex items-center justify-center group-hover:scale-110 transition-transform`}
              >
                <Icon className={`w-6 h-6 ${iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
