import React from 'react';
import { Badge } from '@/components/ui/badge';
import { orderStatusConfig } from './orderStatusConfig';

export const OrderStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config = orderStatusConfig[status] || orderStatusConfig.pending;
  const Icon = config.icon;
  return (
    <Badge className={config.color}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
};
