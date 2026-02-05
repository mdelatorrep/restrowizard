import React from 'react';
 import { Settings } from 'lucide-react';
import OperationsAIModule from '@/components/OperationsAIModule';
 import { ModulePageLayout, PageHeader } from '@/components/layout';

const Operations: React.FC = () => {
  return (
     <ModulePageLayout>
       <PageHeader
         title="Operaciones IA"
         description="Optimiza las operaciones diarias de tu restaurante"
         icon={Settings}
       />
      <OperationsAIModule />
     </ModulePageLayout>
  );
};

export default Operations;
