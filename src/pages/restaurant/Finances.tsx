import React from 'react';
import { DollarSign } from 'lucide-react';
import AdvancedFinancesDashboard from '@/components/finances/AdvancedFinancesDashboard';
import { ModulePageLayout, PageHeader } from '@/components/layout';

const Finances: React.FC = () => {
  return (
    <ModulePageLayout>
      <PageHeader
        title="Centro Financiero"
        description="Control de Prime Cost, P&L y rentabilidad en tiempo real"
        icon={DollarSign}
      />
      <AdvancedFinancesDashboard />
    </ModulePageLayout>
  );
};

export default Finances;
