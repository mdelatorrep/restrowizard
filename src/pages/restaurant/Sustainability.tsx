import React from 'react';
import SustainabilityAIModule from '@/components/SustainabilityAIModule';

const Sustainability: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold text-foreground">
          Sostenibilidad
        </h1>
        <p className="text-muted-foreground font-lato-light">
          Reduce tu huella ambiental y optimiza recursos
        </p>
      </div>
      <SustainabilityAIModule />
    </div>
  );
};

export default Sustainability;
