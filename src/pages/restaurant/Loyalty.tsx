import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
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
import { useAIAgent } from '@/hooks/useAIAgent';
import { cn } from '@/lib/utils';

// Tier Badge Component
const TierBadge = ({ tier }: { tier?: LoyaltyTier }) => {
  if (!tier) return <Badge variant="outline">Sin nivel</Badge>;
  
  return (
    <Badge 
      style={{ backgroundColor: tier.color, color: '#fff' }}
      className="font-medium"
    >
      <Star className="w-3 h-3 mr-1" />
      {tier.name}
    </Badge>
  );
};

// Customer Card Component
const CustomerCard = ({ 
  customer, 
  onViewDetails,
  onAwardPoints,
  onShowQR
}: { 
  customer: LoyaltyCustomer;
  onViewDetails: () => void;
  onAwardPoints: () => void;
  onShowQR: () => void;
}) => {
  const isAtRisk = customer.churn_risk_score >= 0.6 || (customer.days_since_last_order && customer.days_since_last_order > 45);
  
  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      isAtRisk && "border-destructive/50 bg-destructive/5"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold">{customer.customer_name}</h3>
            <p className="text-sm text-muted-foreground">
              {customer.customer_email || customer.customer_phone || 'Sin contacto'}
            </p>
          </div>
          <TierBadge tier={customer.tier} />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3 text-center">
          <div>
            <p className="text-lg font-bold text-primary">{customer.current_points}</p>
            <p className="text-xs text-muted-foreground">Puntos</p>
          </div>
          <div>
            <p className="text-lg font-bold">{customer.total_orders}</p>
            <p className="text-xs text-muted-foreground">Órdenes</p>
          </div>
          <div>
            <p className="text-lg font-bold">${customer.total_spent.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>

        {isAtRisk && (
          <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>
              {customer.days_since_last_order 
                ? `${customer.days_since_last_order} días sin comprar`
                : 'Riesgo de abandono'}
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onShowQR}>
            <QrCode className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={onViewDetails}>
            <Eye className="w-4 h-4 mr-1" /> Ver
          </Button>
          <Button size="sm" className="flex-1" onClick={onAwardPoints}>
            <Coins className="w-4 h-4 mr-1" /> +Puntos
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Reward Catalog Card
const RewardCard = ({ 
  reward,
  onEdit 
}: { 
  reward: RewardsCatalogItem;
  onEdit: () => void;
}) => {
  const typeLabels: Record<string, string> = {
    discount_percent: 'Descuento %',
    discount_fixed: 'Descuento $',
    free_item: 'Producto Gratis',
    free_delivery: 'Delivery Gratis',
    experience: 'Experiencia',
    upgrade: 'Upgrade',
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-24 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
        <Gift className="w-10 h-10 text-primary" />
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold">{reward.name}</h3>
          <Badge variant="secondary">{typeLabels[reward.reward_type]}</Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {reward.description || 'Sin descripción'}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-primary font-bold">
            <Coins className="w-4 h-4" />
            {reward.points_required}
          </div>
          {reward.stock_limit && (
            <span className="text-xs text-muted-foreground">
              {reward.stock_limit - reward.stock_used} disponibles
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

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
  const [newReward, setNewReward] = useState({ name: '', description: '', points_required: 100, reward_type: 'discount_percent' as const, reward_value: 10 });
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
        <TabsContent value="customers" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => setShowNewCustomerDialog(true)}>
              <Plus className="w-4 h-4 mr-2" /> Nuevo Cliente
            </Button>
          </div>

          {filteredCustomers.length === 0 ? (
            <EmptyState
              icon={<Users className="w-12 h-12" />}
              title="Sin clientes en el programa"
              description="Registra tu primer cliente para comenzar a construir lealtad"
              actionLabel="Agregar Cliente"
              onAction={() => setShowNewCustomerDialog(true)}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCustomers.map(customer => (
                <CustomerCard
                  key={customer.id}
                  customer={customer}
                  onViewDetails={() => {}}
                  onAwardPoints={() => {
                    setSelectedCustomer(customer);
                    setShowAwardPointsDialog(true);
                  }}
                  onShowQR={() => {
                    setSelectedCustomer(customer);
                    setShowQRDialog(true);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowNewRewardDialog(true)}>
              <Plus className="w-4 h-4 mr-2" /> Nueva Recompensa
            </Button>
          </div>

          {catalog.length === 0 ? (
            <EmptyState
              icon={<Gift className="w-12 h-12" />}
              title="Sin recompensas configuradas"
              description="Crea recompensas atractivas para que tus clientes canjeen sus puntos"
              actionLabel="Crear Recompensa"
              onAction={() => setShowNewRewardDialog(true)}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {catalog.map(reward => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  onEdit={() => {}}
                />
              ))}
            </div>
          )}
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

      {/* New Tier Dialog */}
      <Dialog open={showNewTierDialog} onOpenChange={setShowNewTierDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nivel</DialogTitle>
            <DialogDescription>Define un nuevo nivel para tu programa de fidelización</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre del nivel</Label>
              <Input
                value={newTier.name}
                onChange={(e) => setNewTier({ ...newTier, name: e.target.value })}
                placeholder="Ej: Oro, Platino, VIP..."
              />
            </div>
            <div>
              <Label>Puntos mínimos requeridos</Label>
              <Input
                type="number"
                value={newTier.min_points}
                onChange={(e) => setNewTier({ ...newTier, min_points: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Multiplicador de puntos</Label>
              <Input
                type="number"
                step="0.1"
                value={newTier.points_multiplier}
                onChange={(e) => setNewTier({ ...newTier, points_multiplier: parseFloat(e.target.value) || 1 })}
              />
            </div>
            <div>
              <Label>Color</Label>
              <Input
                type="color"
                value={newTier.color}
                onChange={(e) => setNewTier({ ...newTier, color: e.target.value })}
                className="h-10 w-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTierDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateTier}>Crear Nivel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Customer Dialog */}
      <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Cliente</DialogTitle>
            <DialogDescription>Añade un nuevo miembro al programa de fidelización</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={newCustomer.customer_name}
                onChange={(e) => setNewCustomer({ ...newCustomer, customer_name: e.target.value })}
                placeholder="Nombre del cliente"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={newCustomer.customer_email}
                onChange={(e) => setNewCustomer({ ...newCustomer, customer_email: e.target.value })}
                placeholder="cliente@email.com"
              />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input
                value={newCustomer.customer_phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, customer_phone: e.target.value })}
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCustomerDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateCustomer} disabled={!newCustomer.customer_name}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Reward Dialog */}
      <Dialog open={showNewRewardDialog} onOpenChange={setShowNewRewardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Recompensa</DialogTitle>
            <DialogDescription>Crea una recompensa para el catálogo de canjes</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={newReward.name}
                onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
                placeholder="Ej: Postre Gratis, 10% Descuento..."
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                value={newReward.description}
                onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                placeholder="Describe la recompensa..."
              />
            </div>
            <div>
              <Label>Puntos requeridos *</Label>
              <Input
                type="number"
                value={newReward.points_required}
                onChange={(e) => setNewReward({ ...newReward, points_required: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Tipo de recompensa</Label>
              <Select
                value={newReward.reward_type}
                onValueChange={(value) => setNewReward({ ...newReward, reward_type: value as typeof newReward.reward_type })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discount_percent">Descuento %</SelectItem>
                  <SelectItem value="discount_fixed">Descuento $</SelectItem>
                  <SelectItem value="free_item">Producto Gratis</SelectItem>
                  <SelectItem value="free_delivery">Delivery Gratis</SelectItem>
                  <SelectItem value="experience">Experiencia</SelectItem>
                  <SelectItem value="upgrade">Upgrade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor (si aplica)</Label>
              <Input
                type="number"
                value={newReward.reward_value}
                onChange={(e) => setNewReward({ ...newReward, reward_value: parseFloat(e.target.value) || 0 })}
                placeholder="Ej: 10 para 10%"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewRewardDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateReward} disabled={!newReward.name || !newReward.points_required}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Award Points Dialog */}
      <Dialog open={showAwardPointsDialog} onOpenChange={setShowAwardPointsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Otorgar Puntos</DialogTitle>
            <DialogDescription>
              Añade puntos a {selectedCustomer?.customer_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Puntos a otorgar</Label>
              <Input
                type="number"
                value={pointsToAward.points}
                onChange={(e) => setPointsToAward({ ...pointsToAward, points: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Razón</Label>
              <Select
                value={pointsToAward.reason}
                onValueChange={(value) => setPointsToAward({ ...pointsToAward, reason: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Compra">Compra</SelectItem>
                  <SelectItem value="Reseña">Reseña</SelectItem>
                  <SelectItem value="Referido">Referido</SelectItem>
                  <SelectItem value="Cumpleaños">Cumpleaños</SelectItem>
                  <SelectItem value="Promoción">Promoción</SelectItem>
                  <SelectItem value="Ajuste manual">Ajuste manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAwardPointsDialog(false)}>Cancelar</Button>
            <Button onClick={handleAwardPoints} disabled={!pointsToAward.points}>
              <Coins className="w-4 h-4 mr-2" /> Otorgar {pointsToAward.points} puntos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
