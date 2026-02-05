import React from 'react';
 import { DollarSign } from 'lucide-react';
import FinancesAIModule from '@/components/FinancesAIModule';
 import { ModulePageLayout, PageHeader } from '@/components/layout';

const Finances: React.FC = () => {
  return (
     <ModulePageLayout>
       <PageHeader
         title="Finanzas IA"
         description="Análisis financiero inteligente para tu restaurante"
         icon={DollarSign}
       />
      <FinancesAIModule />
     </ModulePageLayout>
  );
};

export default Finances;
