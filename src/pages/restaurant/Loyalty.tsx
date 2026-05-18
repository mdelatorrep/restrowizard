import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/ui/empty-state';
import { AIInsightsPanel } from '@/components/AIInsightsPanel';
import { 
  Crown, 
  Users, 
  Gift, 
  TrendingUp, 
  AlertTriangle, 
  Star, 
  Plus,
  Target,
  Sparkles,
  Trophy,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Heart,
  Zap,
  Search,
  MoreVertical,
  Eye,
  Award,
  QrCode,
  Brain,
  UserMinus
} from 'lucide-react';
import { useLoyaltyData, type LoyaltyCustomer, type LoyaltyTier, type RewardsCatalogItem } from '@/hooks/useLoyaltyData';
import { LoyaltyQRDialog } from '@/components/loyalty/LoyaltyQRDialog';
import { TierBadge } from '@/components/loyalty/LoyaltyCards';
import { CustomersTab } from '@/components/loyalty/CustomersTab';
import { RewardsTab } from '@/components/loyalty/RewardsTab';
import { NewTierDialog } from '@/components/loyalty/NewTierDialog';
import { NewCustomerDialog } from '@/components/loyalty/NewCustomerDialog';
import { NewRewardDialog } from '@/components/loyalty/NewRewardDialog';
import { AwardPointsDialog } from '@/components/loyalty/AwardPointsDialog';
import { useAIAgent } from '@/hooks/useAIAgent';
import { cn } from '@/lib/utils';

// Tier Badge Component
// TierBadge / CustomerCard / RewardCard extracted to src/components/loyalty/LoyaltyCards.tsx
//
// Unused imports kept lean below; legacy types re-exported via the import above.

// Keep references used downstream
type _KeepTypes = LoyaltyCustomer | LoyaltyTier | RewardsCatalogItem;

// Main Component
const Loyalty = () => {
  const {
    customers,
    tiers,
    catalog,
    campaigns,
    achievements,
    kpis,
    loading,
    hasData,
    createTier,
    createCustomer,
    awardPoints,
    createCatalogItem,
    createCampaign,
    createAchievement,
    getAtRiskCustomers,
    getVIPCustomers,
    getCustomersByTier,
  } = useLoyaltyData();

  const { preventChurn, getLoyaltyRecommendations, generatePersonalizedOffers, loading: aiLoading } = useAIAgent();

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

  // Form states
  const [newTier, setNewTier] = useState({ name: '', min_points: 0, points_multiplier: 1.0, color: '#6B7280' });
  const [newCustomer, setNewCustomer] = useState({ customer_name: '', customer_email: '', customer_phone: '' });
  const [newReward, setNewReward] = useState<{ name: string; description: string; points_required: number; reward_type: 'discount_percent' | 'discount_fixed' | 'free_item' | 'free_delivery' | 'experience' | 'upgrade'; reward_value: number }>({ name: '', description: '', points_required: 100, reward_type: 'discount_percent', reward_value: 10 });
  const [pointsToAward, setPointsToAward] = useState({ points: 100, reason: 'Compra' });

  const filteredCustomers = customers.filter(c =>
    c.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.customer_phone?.includes(searchTerm)
  );

  const atRiskCustomers = getAtRiskCustomers();
  const vipCustomers = getVIPCustomers();
  const tierDistribution = getCustomersByTier();

  // AI Analysis handlers
  const handleChurnAnalysis = async () => {
    if (atRiskCustomers.length === 0) {
      // Analyze general loyalty data instead
      const loyaltyData = {
        total_clientes: kpis?.totalCustomers || 0,
        ltv_promedio: kpis?.avgLTV || 0,
        puntos_circulacion: kpis?.totalPointsCirculating || 0,
        tasa_retencion: kpis?.retentionRate || 0,
        clientes_vip: vipCustomers.map(c => ({
          nombre: c.customer_name,
          puntos: c.current_points,
          total_gastado: c.total_spent,
          ordenes: c.total_orders
        })),
        distribucion_niveles: tierDistribution
      };
      
      const result = await getLoyaltyRecommendations(loyaltyData);
      if (result) {
        setAiInsights(result);
        setShowAIPanel(true);
      }
      return;
    }

    const churnData = atRiskCustomers.map(c => ({
      nombre: c.customer_name,
      email: c.customer_email,
      puntos: c.current_points,
      total_gastado: c.total_spent,
      ordenes: c.total_orders,
      dias_sin_comprar: c.days_since_last_order,
      riesgo: c.churn_risk_score,
      nivel: c.tier?.name
    }));

    const result = await preventChurn({
      clientes_en_riesgo: churnData,
      total_en_riesgo: atRiskCustomers.length,
      tasa_retencion: kpis?.retentionRate
    });
    
    if (result) {
      setAiInsights(result);
      setShowAIPanel(true);
    }
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
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="h-32 animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="w-6 h-6 text-primary" />
            Programa de Fidelización
          </h1>
          <p className="text-muted-foreground">Aumenta el lifetime value de tus clientes</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleChurnAnalysis}
            disabled={aiLoading}
            className="gap-2 border-primary/30 hover:bg-primary/10"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            {aiLoading ? 'Analizando...' : 'Análisis IA'}
          </Button>
          <Button variant="outline" onClick={() => setShowNewCustomerDialog(true)}>
            <Plus className="w-4 h-4 mr-2" /> Cliente
          </Button>
          <Button onClick={() => setShowNewRewardDialog(true)}>
            <Gift className="w-4 h-4 mr-2" /> Recompensa
          </Button>
        </div>
      </div>

      {/* AI Insights Panel */}
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

      {/* KPIs */}
      {kpis && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Miembros</p>
                  <p className="text-2xl font-bold">{kpis.totalCustomers}</p>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm text-green-600">
                <ArrowUpRight className="w-4 h-4" />
                <span>{kpis.activeCustomers} activos</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">LTV Promedio</p>
                  <p className="text-2xl font-bold">${kpis.avgLTV.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <Progress value={75} className="mt-3 h-1" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Puntos en Circulación</p>
                  <p className="text-2xl font-bold">{kpis.totalPointsCirculating.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
                  <Coins className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                ~{kpis.avgPointsPerCustomer} por cliente
              </p>
            </CardContent>
          </Card>

          <Card className={atRiskCustomers.length > 0 ? "border-destructive/50" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">En Riesgo</p>
                  <p className="text-2xl font-bold">{kpis.atRiskCustomers}</p>
                </div>
                <div className="p-3 rounded-full bg-destructive/10">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm text-muted-foreground">
                <span>Retención: {kpis.retentionRate}%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
          <TabsTrigger value="rewards">Recompensas</TabsTrigger>
          <TabsTrigger value="tiers">Niveles</TabsTrigger>
          <TabsTrigger value="campaigns">Campañas</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* At Risk Customers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  Clientes en Riesgo
                </CardTitle>
                <CardDescription>Requieren atención para evitar abandono</CardDescription>
              </CardHeader>
              <CardContent>
                {atRiskCustomers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    <Heart className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    Todos tus clientes están activos
                  </p>
                ) : (
                  <div className="space-y-3">
                    {atRiskCustomers.slice(0, 5).map(customer => (
                      <div key={customer.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{customer.customer_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {customer.days_since_last_order} días sin comprar
                          </p>
                        </div>
                        <Button size="sm" variant="outline">
                          <Zap className="w-4 h-4 mr-1" /> Recuperar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* VIP Customers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  Clientes VIP
                </CardTitle>
                <CardDescription>Tus mejores clientes por lifetime value</CardDescription>
              </CardHeader>
              <CardContent>
                {vipCustomers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Aún no hay clientes VIP
                  </p>
                ) : (
                  <div className="space-y-3">
                    {vipCustomers.slice(0, 5).map((customer, idx) => (
                      <div key={customer.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-medium">{customer.customer_name}</p>
                            <p className="text-sm text-muted-foreground">
                              ${customer.total_spent.toLocaleString()} total
                            </p>
                          </div>
                        </div>
                        <TierBadge tier={customer.tier} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tier Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Distribución por Nivel
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tiers.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-3">Configura los niveles de tu programa</p>
                    <Button variant="outline" onClick={() => setShowNewTierDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" /> Crear Nivel
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(tierDistribution).map(([tierName, count]) => {
                      const tier = tiers.find(t => t.name === tierName);
                      const percentage = customers.length > 0 ? (count / customers.length) * 100 : 0;
                      return (
                        <div key={tierName} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span style={{ color: tier?.color }}>{tierName}</span>
                            <span className="text-muted-foreground">{count} ({Math.round(percentage)}%)</span>
                          </div>
                          <Progress 
                            value={percentage} 
                            className="h-2"
                            style={{ '--progress-color': tier?.color } as React.CSSProperties}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Insights IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5">
                  <p className="text-sm font-medium mb-2">Oportunidad detectada</p>
                  <p className="text-sm text-muted-foreground">
                    {atRiskCustomers.length > 0 
                      ? `${atRiskCustomers.length} clientes podrían reactivarse con una campaña de ${Math.round(atRiskCustomers.length * 50)} puntos bonus`
                      : 'Tu programa de fidelización está funcionando correctamente'}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium mb-2">Próximos cumpleaños</p>
                  <p className="text-sm text-muted-foreground">
                    {customers.filter(c => c.birthday).length > 0
                      ? `${customers.filter(c => c.birthday).length} clientes tienen cumpleaños registrado`
                      : 'Registra cumpleaños para campañas personalizadas'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers">
          <CustomersTab
            customers={filteredCustomers}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onNewCustomer={() => setShowNewCustomerDialog(true)}
            onAwardPoints={(c) => {
              setSelectedCustomer(c);
              setShowAwardPointsDialog(true);
            }}
            onShowQR={(c) => {
              setSelectedCustomer(c);
              setShowQRDialog(true);
            }}
          />
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards">
          <RewardsTab
            catalog={catalog}
            onNewReward={() => setShowNewRewardDialog(true)}
          />
        </TabsContent>

        {/* Tiers Tab */}
        <TabsContent value="tiers" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowNewTierDialog(true)}>
              <Plus className="w-4 h-4 mr-2" /> Nuevo Nivel
            </Button>
          </div>

          {tiers.length === 0 ? (
            <EmptyState
              icon={<Crown className="w-12 h-12" />}
              title="Sin niveles configurados"
              description="Crea niveles para gamificar tu programa y motivar a los clientes"
              actionLabel="Crear Nivel"
              onAction={() => setShowNewTierDialog(true)}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {tiers.map(tier => (
                <Card key={tier.id} className="overflow-hidden">
                  <div 
                    className="h-2"
                    style={{ backgroundColor: tier.color }}
                  />
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="w-5 h-5" style={{ color: tier.color }} />
                      <h3 className="font-semibold">{tier.name}</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Puntos mínimos</span>
                        <span className="font-medium">{tier.min_points.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Multiplicador</span>
                        <span className="font-medium">{tier.points_multiplier}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Miembros</span>
                        <span className="font-medium">{tierDistribution[tier.name] || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Campañas de Puntos
              </CardTitle>
              <CardDescription>Crea campañas para impulsar comportamientos específicos</CardDescription>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No hay campañas activas</p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" /> Crear Campaña
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns.map(campaign => (
                    <div key={campaign.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-sm text-muted-foreground">{campaign.description}</p>
                      </div>
                      <Badge variant={campaign.is_active ? "default" : "secondary"}>
                        {campaign.is_active ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <NewTierDialog
        open={showNewTierDialog}
        onOpenChange={setShowNewTierDialog}
        value={newTier}
        onChange={setNewTier}
        onSubmit={handleCreateTier}
      />

      <NewCustomerDialog
        open={showNewCustomerDialog}
        onOpenChange={setShowNewCustomerDialog}
        value={newCustomer}
        onChange={setNewCustomer}
        onSubmit={handleCreateCustomer}
      />

      <NewRewardDialog
        open={showNewRewardDialog}
        onOpenChange={setShowNewRewardDialog}
        value={newReward}
        onChange={setNewReward}
        onSubmit={handleCreateReward}
      />

      <AwardPointsDialog
        open={showAwardPointsDialog}
        onOpenChange={setShowAwardPointsDialog}
        value={pointsToAward}
        onChange={setPointsToAward}
        customerName={selectedCustomer?.customer_name}
        onSubmit={handleAwardPoints}
      />
      {/* QR Dialog */}
      <LoyaltyQRDialog
        customer={selectedCustomer}
        open={showQRDialog}
        onOpenChange={setShowQRDialog}
      />
    </div>
  );
};

export default Loyalty;
