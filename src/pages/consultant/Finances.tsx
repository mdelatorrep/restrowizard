import React from 'react';
import AdvancedFinancesDashboard from '@/components/finances/AdvancedFinancesDashboard';
import { RequireActiveClient } from '@/components/consultant/RequireActiveClient';

const Finances: React.FC = () => {
  return (
    <RequireActiveClient moduleName="Centro Financiero">
      <AdvancedFinancesDashboard />
    </RequireActiveClient>
  );
};

export default Finances;
