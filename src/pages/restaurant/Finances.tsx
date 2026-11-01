import React, { Suspense, lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DollarSign, PieChart, Receipt, CalendarClock, Waves, Scale, Loader2 } from 'lucide-react';
import AdvancedFinancesDashboard from '@/components/finances/AdvancedFinancesDashboard';
import { ModulePageLayout, PageHeader, ResponsiveTabs, TabsContent } from '@/components/layout';

// Pestañas de finanzas integrales: se cargan al abrirlas.
const ExpensesPanel = lazy(() => import('@/components/finances/integral/ExpensesPanel'));
const PayablesPanel = lazy(() => import('@/components/finances/integral/PayablesPanel'));
const CashFlowPanel = lazy(() => import('@/components/finances/integral/CashFlowPanel'));
const ReconciliationPanel = lazy(() => import('@/components/finances/integral/ReconciliationPanel'));

const TABS = [
  { value: 'pnl', label: 'Rentabilidad', icon: PieChart },
  { value: 'expenses', label: 'Gastos', icon: Receipt },
  { value: 'payables', label: 'Cuentas por pagar', icon: CalendarClock },
  { value: 'cashflow', label: 'Flujo de caja', icon: Waves },
  { value: 'reconciliation', label: 'Conciliación', icon: Scale },
];

const Loading = () => (
  <div className="flex min-h-[30vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
);

const Finances: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.some(t => t.value === searchParams.get('tab')) ? (searchParams.get('tab') as string) : 'pnl';

  return (
    <ModulePageLayout>
      <PageHeader
        title="Centro Financiero"
        description="Rentabilidad, gastos, pagos, caja y conciliación del negocio en un solo lugar"
        icon={DollarSign}
      />
      <ResponsiveTabs tabs={TABS} value={tab} onValueChange={v => setSearchParams({ tab: v })}>
        <TabsContent value="pnl"><AdvancedFinancesDashboard /></TabsContent>
        <TabsContent value="expenses"><Suspense fallback={<Loading />}><ExpensesPanel /></Suspense></TabsContent>
        <TabsContent value="payables"><Suspense fallback={<Loading />}><PayablesPanel /></Suspense></TabsContent>
        <TabsContent value="cashflow"><Suspense fallback={<Loading />}><CashFlowPanel /></Suspense></TabsContent>
        <TabsContent value="reconciliation"><Suspense fallback={<Loading />}><ReconciliationPanel /></Suspense></TabsContent>
      </ResponsiveTabs>
    </ModulePageLayout>
  );
};

export default Finances;
