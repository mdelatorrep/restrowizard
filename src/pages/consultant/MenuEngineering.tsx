import React from 'react';
import MenuInventoryAIModule from '@/components/MenuInventoryAIModule';
import { RequireActiveClient } from '@/components/consultant/RequireActiveClient';

const MenuEngineering: React.FC = () => {
  return (
    <RequireActiveClient moduleName="Ingeniería de Menú">
      <MenuInventoryAIModule />
    </RequireActiveClient>
  );
};

export default MenuEngineering;
