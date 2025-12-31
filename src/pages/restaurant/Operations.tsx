import React from 'react';
import OperationsAIModule from '@/components/OperationsAIModule';

const Operations: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold text-foreground">
          Operaciones IA
        </h1>
        <p className="text-muted-foreground font-lato-light">
          Optimiza las operaciones diarias de tu restaurante
        </p>
      </div>
      <OperationsAIModule />
    </div>
  );
};

export default Operations;
