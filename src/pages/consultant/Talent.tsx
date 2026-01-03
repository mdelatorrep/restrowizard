import React from 'react';
import TalentAIModule from '@/components/TalentAIModule';
import { RequireActiveClient } from '@/components/consultant/RequireActiveClient';

const Talent: React.FC = () => {
  return (
    <RequireActiveClient moduleName="Talento IA">
      <TalentAIModule />
    </RequireActiveClient>
  );
};

export default Talent;
