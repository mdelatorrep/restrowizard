import React from 'react';
import SustainabilityAIModule from '@/components/SustainabilityAIModule';
import { RequireActiveClient } from '@/components/consultant/RequireActiveClient';

const Sustainability: React.FC = () => {
  return (
    <RequireActiveClient moduleName="Sostenibilidad">
      <SustainabilityAIModule />
    </RequireActiveClient>
  );
};

export default Sustainability;
