import React from 'react';
import MenuInventoryAIModule from '@/components/MenuInventoryAIModule';

const MenuEngineering: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold text-foreground">
          Ingeniería de Menú
        </h1>
        <p className="text-muted-foreground font-lato-light">
          Optimiza tu menú para maximizar rentabilidad
        </p>
      </div>
      <MenuInventoryAIModule />
    </div>
  );
};

export default MenuEngineering;
