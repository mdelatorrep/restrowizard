import React from 'react';
import FinancesAIModule from '@/components/FinancesAIModule';

const Finances: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold text-foreground">
          Finanzas IA
        </h1>
        <p className="text-muted-foreground font-lato-light">
          Análisis financiero inteligente para tu restaurante
        </p>
      </div>
      <FinancesAIModule />
    </div>
  );
};

export default Finances;
