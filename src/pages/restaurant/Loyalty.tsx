import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIInsightsPanel } from '@/components/AIInsightsPanel';
import { UserMinus } from 'lucide-react';
import { useLoyaltyData, type LoyaltyCustomer } from '@/hooks/useLoyaltyData';
import { LoyaltyQRDialog } from '@/components/loyalty/LoyaltyQRDialog';
import { CustomersTab } from '@/components/loyalty/CustomersTab';
import { RewardsTab } from '@/components/loyalty/RewardsTab';
import { NewTierDialog } from '@/components/loyalty/NewTierDialog';
import { NewCustomerDialog } from '@/components/loyalty/NewCustomerDialog';
import { NewRewardDialog } from '@/components/loyalty/NewRewardDialog';
import { AwardPointsDialog } from '@/components/loyalty/AwardPointsDialog';
import { LoyaltyHeader } from '@/components/loyalty/LoyaltyHeader';
import { LoyaltyKPIs } from '@/components/loyalty/LoyaltyKPIs';
import { LoyaltyOverviewTab } from '@/components/loyalty/LoyaltyOverviewTab';
import { LoyaltyTiersTab } from '@/components/loyalty/LoyaltyTiersTab';
import { LoyaltyCampaignsTab } from '@/components/loyalty/LoyaltyCampaignsTab';
import { useAIAgent } from '@/hooks/useAIAgent';

type RewardType = 'discount_percent' | 'discount_fixed' | 'free_item' | 'free_delivery' | 'experience' | 'upgrade';

const Loyalty = () => {
  const {
    customers, tiers, catalog, campaigns, kpis, loading,
    createTier, createCustomer, awardPoints, createCatalogItem,
    getAtRiskCustomers, getVIPCustomers, getCustomersByTier,
  } = useLoyaltyData();

  const { preventChurn, getLoyaltyRecommendations, loading: aiLoading } = useAIAgent();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showNewTierDialog, setShowNewTierDialog] = useState(false);
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  const [showNewRewardDialog, setShowNewRewardDialog] = useState(false);
  const [showAwardPointsDialog, setShowAwardPointsDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<LoyaltyCustomer | null>(null);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);

  const [newTier, setNewTier] = useState({ name: '', min_points: 0, points_multiplier: 1.0, color: '#6B7280' });
  const [newCustomer, setNewCustomer] = useState({ customer_name: '', customer_email: '', customer_phone: '' });
  const [newReward, setNewReward] = useState<{ name: string; description: string; points_required: number; reward_type: RewardType; reward_value: number }>({
    name: '', description: '', points_required: 100, reward_type: 'discount_percent', reward_value: 10
  });
  const [pointsToAward, setPointsToAward] = useState({ points: 100, reason: 'Compra' });

  const filteredCustomers = useMemo(
    () =>
      customers.filter(c =>
        c.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customer_phone?.includes(searchTerm)
      ),
    [customers, searchTerm]
  );

  const atRiskCustomers = useMemo(() => getAtRiskCustomers(), [getAtRiskCustomers]);
  const vipCustomers = useMemo(() => getVIPCustomers(), [getVIPCustomers]);
  const tierDistribution = useMemo(() => getCustomersByTier(), [getCustomersByTier]);



  const handleChurnAnalysis = async () => {
    if (atRiskCustomers.length === 0) {
      const result = await getLoyaltyRecommendations({
        total_clientes: kpis?.totalCustomers || 0,
        ltv_promedio: kpis?.avgLTV || 0,
        puntos_circulacion: kpis?.totalPointsCirculating || 0,
        tasa_retencion: kpis?.retentionRate || 0,
        clientes_vip: vipCustomers.map(c => ({
          nombre: c.customer_name, puntos: c.current_points,
          total_gastado: c.total_spent, ordenes: c.total_orders
        })),
        distribucion_niveles: tierDistribution
      });
      if (result) { setAiInsights(result); setShowAIPanel(true); }
      return;
    }

    const result = await preventChurn({
      clientes_en_riesgo: atRiskCustomers.map(c => ({
        nombre: c.customer_name, email: c.customer_email, puntos: c.current_points,
        total_gastado: c.total_spent, ordenes: c.total_orders,
        dias_sin_comprar: c.days_since_last_order, riesgo: c.churn_risk_score, nivel: c.tier?.name
      })),
      total_en_riesgo: atRiskCustomers.length,
      tasa_retencion: kpis?.retentionRate
    });
    if (result) { setAiInsights(result); setShowAIPanel(true); }
  };

  const handleCreateTier = async () => {
    await createTier(newTier);
    setNewTier({ name: '', min_points: 0, points_multiplier: 1.0, color: '#6B7280' });
    setShowNewTierDialog(false);
  };

  const handleCreateCustomer = async () => {
    await createCustomer(newCustomer);
    setNewCustomer({ customer_name: '', customer_email: '', customer_phone: '' });
    setShowNewCustomerDialog(false);
  };

  const handleCreateReward = async () => {
    await createCatalogItem(newReward);
    setNewReward({ name: '', description: '', points_required: 100, reward_type: 'discount_percent', reward_value: 10 });
    setShowNewRewardDialog(false);
  };

  const handleAwardPoints = async () => {
    if (!selectedCustomer) return;
    await awardPoints(selectedCustomer.id, pointsToAward.points, pointsToAward.reason);
    setPointsToAward({ points: 100, reason: 'Compra' });
    setShowAwardPointsDialog(false);
    setSelectedCustomer(null);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Card key={i} className="h-32 animate-pulse bg-muted" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <LoyaltyHeader
        aiLoading={aiLoading}
        onAnalyze={handleChurnAnalysis}
        onNewCustomer={() => setShowNewCustomerDialog(true)}
        onNewReward={() => setShowNewRewardDialog(true)}
      />

      {showAIPanel && (
        <AIInsightsPanel
          title="Análisis de Fidelización"
          description="Estrategias de retención y prevención de abandono"
          insights={aiInsights}
          loading={aiLoading}
          onAnalyze={handleChurnAnalysis}
          onClose={() => setShowAIPanel(false)}
          icon={<UserMinus className="w-5 h-5 text-primary" />}
        />
      )}

      {kpis && <LoyaltyKPIs kpis={kpis} atRiskCount={atRiskCustomers.length} />}

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
          <TabsTrigger value="rewards">Recompensas</TabsTrigger>
          <TabsTrigger value="tiers">Niveles</TabsTrigger>
          <TabsTrigger value="campaigns">Campañas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <LoyaltyOverviewTab
            atRiskCustomers={atRiskCustomers}
            vipCustomers={vipCustomers}
            tiers={tiers}
            tierDistribution={tierDistribution}
            customers={customers}
            onCreateTier={() => setShowNewTierDialog(true)}
          />
        </TabsContent>

        <TabsContent value="customers">
          <CustomersTab
            customers={filteredCustomers}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onNewCustomer={() => setShowNewCustomerDialog(true)}
            onAwardPoints={(c) => { setSelectedCustomer(c); setShowAwardPointsDialog(true); }}
            onShowQR={(c) => { setSelectedCustomer(c); setShowQRDialog(true); }}
          />
        </TabsContent>

        <TabsContent value="rewards">
          <RewardsTab catalog={catalog} onNewReward={() => setShowNewRewardDialog(true)} />
        </TabsContent>

        <TabsContent value="tiers">
          <LoyaltyTiersTab
            tiers={tiers}
            tierDistribution={tierDistribution}
            onNewTier={() => setShowNewTierDialog(true)}
          />
        </TabsContent>

        <TabsContent value="campaigns">
          <LoyaltyCampaignsTab campaigns={campaigns} />
        </TabsContent>
      </Tabs>

      <NewTierDialog open={showNewTierDialog} onOpenChange={setShowNewTierDialog} value={newTier} onChange={setNewTier} onSubmit={handleCreateTier} />
      <NewCustomerDialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog} value={newCustomer} onChange={setNewCustomer} onSubmit={handleCreateCustomer} />
      <NewRewardDialog open={showNewRewardDialog} onOpenChange={setShowNewRewardDialog} value={newReward} onChange={setNewReward} onSubmit={handleCreateReward} />
      <AwardPointsDialog open={showAwardPointsDialog} onOpenChange={setShowAwardPointsDialog} value={pointsToAward} onChange={setPointsToAward} customerName={selectedCustomer?.customer_name} onSubmit={handleAwardPoints} />
      <LoyaltyQRDialog customer={selectedCustomer} open={showQRDialog} onOpenChange={setShowQRDialog} />
    </div>
  );
};

export default Loyalty;
