import React from 'react';
import OperationsAIModule from '@/components/OperationsAIModule';
import { RequireActiveClient } from '@/components/consultant/RequireActiveClient';

const Operations: React.FC = () => {
  return (
    <RequireActiveClient moduleName="Operaciones IA">
      <OperationsAIModule />
    </RequireActiveClient>
  );
};

export default Operations;
