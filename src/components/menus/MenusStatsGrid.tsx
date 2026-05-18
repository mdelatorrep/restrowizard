import React from 'react';
import { FileEdit, CheckCircle, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  total: number;
  published: number;
  totalViews: number;
}

const StatCard: React.FC<{
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  bgFrom: string;
  bgTo: string;
  textColor?: string;
}> = ({ icon, value, label, bgFrom, bgTo, textColor }) => (
  <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-card to-muted/30">
    <CardContent className="p-5">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${bgFrom} ${bgTo} flex items-center justify-center group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <div>
          <p className={`text-3xl font-bold ${textColor || ''}`}>{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export const MenusStatsGrid: React.FC<Props> = ({ total, published, totalViews }) => {
  const avg = totalViews > 0 && total > 0 ? Math.round(totalViews / total) : 0;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        icon={<FileEdit className="w-6 h-6 text-primary" />}
        value={total}
        label="Menús creados"
        bgFrom="from-primary/20"
        bgTo="to-primary/10"
        textColor="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
      />
      <StatCard
        icon={<CheckCircle className="w-6 h-6 text-green-600" />}
        value={published}
        label="Publicados"
        bgFrom="from-green-500/20"
        bgTo="to-green-500/10"
        textColor="text-green-600"
      />
      <StatCard
        icon={<Users className="w-6 h-6 text-blue-600" />}
        value={totalViews.toLocaleString()}
        label="Visualizaciones"
        bgFrom="from-blue-500/20"
        bgTo="to-blue-500/10"
        textColor="text-blue-600"
      />
      <StatCard
        icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
        value={avg}
        label="Promedio/menú"
        bgFrom="from-purple-500/20"
        bgTo="to-purple-500/10"
        textColor="text-purple-600"
      />
    </div>
  );
};
