import React from 'react';
import { TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  icon: React.ReactNode;
  title: string;
  value: string;
  trend?: 'up' | 'down' | 'neutral';
  description: string;
  colorClass: string;
}

export const StaffMetric: React.FC<Props> = ({ icon, title, value, trend, description, colorClass }) => (
  <Card className="relative overflow-hidden">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className={`rounded-full p-3 ${colorClass}`}>
          {React.cloneElement(icon as React.ReactElement, { size: 24 })}
        </div>
        {trend && (
          <div className={`flex items-center ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
            {trend === 'up' ? <TrendingUp size={20} /> : trend === 'down' ? <AlertTriangle size={20} /> : <Activity size={20} />}
          </div>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-lato-bold text-foreground">{value}</h3>
        <p className="text-sm font-lato-medium text-muted-foreground">{title}</p>
        <p className="text-xs font-lato-light text-muted-foreground mt-1">{description}</p>
      </div>
    </CardContent>
  </Card>
);
