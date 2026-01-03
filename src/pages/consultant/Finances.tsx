import React from 'react';
import FinancesAIModule from '@/components/FinancesAIModule';
import { RequireActiveClient } from '@/components/consultant/RequireActiveClient';

const Finances: React.FC = () => {
  return (
    <RequireActiveClient moduleName="Finanzas IA">
      <FinancesAIModule />
    </RequireActiveClient>
  );
};

export default Finances;
