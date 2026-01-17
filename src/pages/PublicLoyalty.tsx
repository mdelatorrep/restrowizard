import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  Crown, 
  Star, 
  Gift, 
  Coins, 
  TrendingUp, 
  History, 
  Sparkles,
  ArrowUp,
  CheckCircle2,
  Clock,
  XCircle,
  Trophy,
  PartyPopper,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface LoyaltyTier {
  id: string;
  name: string;
  color: string;
  min_points: number;
  points_multiplier: number;
  benefits: string[];
}

interface LoyaltyCustomer {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  current_points: number;
  lifetime_points: number;
  total_spent: number;
  total_orders: number;
  tier_id: string | null;
  loyalty_code: string;
  tier?: LoyaltyTier | null;
}

interface PointsTransaction {
  id: string;
  points: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
}

interface RewardItem {
  id: string;
  name: string;
  description: string | null;
  points_required: number;
  reward_type: string;
  reward_value: number;
  is_active: boolean;
  min_tier_id: string | null;
}

interface RedeemedReward {
  id: string;
  status: string;
  redeemed_at: string | null;
  expires_at: string | null;
  redemption_code: string | null;
  reward: {
    name: string;
    reward_type: string;
    reward_value: number;
  } | null;
}

const PublicLoyalty = () => {
  const { codigo } = useParams<{ codigo: string }>();
  const { toast } = useToast();
  const [customer, setCustomer] = useState<LoyaltyCustomer | null>(null);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [availableRewards, setAvailableRewards] = useState<RewardItem[]>([]);
  const [redeemedRewards, setRedeemedRewards] = useState<RedeemedReward[]>([]);
  const [allTiers, setAllTiers] = useState<LoyaltyTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Redemption state
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [redemptionResult, setRedemptionResult] = useState<{ code: string; expiresAt: string } | null>(null);

  useEffect(() => {
    if (codigo) {
      fetchCustomerData();
    }
  }, [codigo]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch customer by loyalty code
      const { data: customerData, error: customerError } = await supabase
        .from('loyalty_customers')
        .select(`
          *,
          tier:loyalty_tiers(*)
        `)
        .eq('loyalty_code', codigo)
        .single();

      if (customerError || !customerData) {
        setError('No se encontró tu perfil de fidelidad. Verifica el código.');
        setLoading(false);
        return;
      }

      const mappedCustomer: LoyaltyCustomer = {
        id: customerData.id,
        customer_name: customerData.customer_name,
        customer_email: customerData.customer_email,
        customer_phone: customerData.customer_phone,
        current_points: customerData.current_points,
        lifetime_points: customerData.lifetime_points,
        total_spent: Number(customerData.total_spent),
        total_orders: customerData.total_orders,
        tier_id: customerData.tier_id,
        loyalty_code: customerData.loyalty_code || '',
        tier: customerData.tier ? {
          ...customerData.tier,
          benefits: (customerData.tier.benefits as string[]) || []
        } : null
      };

      setCustomer(mappedCustomer);

      // Fetch all tiers for progress display
      const { data: tiersData } = await supabase
        .from('loyalty_tiers')
        .select('*')
        .eq('user_id', customerData.user_id)
        .order('min_points', { ascending: true });

      if (tiersData) {
        setAllTiers(tiersData.map(t => ({
          ...t,
          benefits: (t.benefits as string[]) || []
        })));
      }

      // Fetch points transactions
      const { data: transactionsData } = await supabase
        .from('loyalty_points_transactions')
        .select('*')
        .eq('customer_id', customerData.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (transactionsData) {
        setTransactions(transactionsData.map(tx => ({
          id: tx.id,
          points: tx.points,
          transaction_type: tx.transaction_type,
          description: tx.description,
          created_at: tx.created_at
        })));
      }

      // Fetch available rewards
      const { data: rewardsData } = await supabase
        .from('loyalty_rewards_catalog')
        .select('*')
        .eq('user_id', customerData.user_id)
        .eq('is_active', true);

      if (rewardsData) {
        // Filter rewards based on tier
        const filteredRewards = rewardsData.filter(r => 
          !r.min_tier_id || r.min_tier_id === customerData.tier_id
        );
        setAvailableRewards(filteredRewards.map(r => ({
          id: r.id,
          name: r.name,
          description: r.description,
          points_required: r.points_required,
          reward_type: r.reward_type,
          reward_value: Number(r.reward_value),
          is_active: r.is_active,
          min_tier_id: r.min_tier_id
        })));
      }

      // Fetch redeemed rewards
      const { data: redeemedData } = await supabase
        .from('loyalty_rewards')
        .select(`
          *,
          reward:loyalty_rewards_catalog(name, reward_type, reward_value)
        `)
        .eq('customer_id', customerData.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (redeemedData) {
        setRedeemedRewards(redeemedData.map(r => ({
          id: r.id,
          status: r.status,
          redeemed_at: r.redeemed_at,
          expires_at: r.expires_at,
          redemption_code: r.redemption_code,
          reward: r.reward ? {
            name: r.reward.name,
            reward_type: r.reward.reward_type,
            reward_value: Number(r.reward.reward_value)
          } : null
        })));
      }

    } catch (err) {
      console.error('Error fetching loyalty data:', err);
      setError('Error al cargar los datos. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Handle reward redemption
  const handleRedeemReward = async () => {
    if (!customer || !selectedReward) return;

    setRedeeming(true);
    try {
      // Generate a unique redemption code
      const redemptionCode = `RW${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      // Calculate expiration (30 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Start transaction: Create reward redemption
      const { data: rewardData, error: rewardError } = await supabase
        .from('loyalty_rewards')
        .insert({
          user_id: customer.tier_id ? (await supabase.from('loyalty_tiers').select('user_id').eq('id', customer.tier_id).single()).data?.user_id : null,
          customer_id: customer.id,
          catalog_item_id: selectedReward.id,
          points_spent: selectedReward.points_required,
          redemption_code: redemptionCode,
          status: 'pending',
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (rewardError) throw rewardError;

      // Deduct points from customer
      const newPoints = customer.current_points - selectedReward.points_required;
      const { error: updateError } = await supabase
        .from('loyalty_customers')
        .update({ current_points: newPoints })
        .eq('id', customer.id);

      if (updateError) throw updateError;

      // Record the transaction
      await supabase
        .from('loyalty_points_transactions')
        .insert({
          user_id: customer.tier_id ? (await supabase.from('loyalty_tiers').select('user_id').eq('id', customer.tier_id).single()).data?.user_id : null,
          customer_id: customer.id,
          points: -selectedReward.points_required,
          transaction_type: 'redeem',
          source: 'reward_redemption',
          source_id: rewardData.id,
          description: `Canje: ${selectedReward.name}`,
          balance_after: newPoints
        });

      // Update local state
      setCustomer(prev => prev ? { ...prev, current_points: newPoints } : null);
      setRedemptionResult({
        code: redemptionCode,
        expiresAt: expiresAt.toISOString()
      });
      
      setShowConfirmDialog(false);
      setShowSuccessDialog(true);

      // Refresh data
      fetchCustomerData();

    } catch (err) {
      console.error('Error redeeming reward:', err);
      toast({
        title: 'Error',
        description: 'No se pudo canjear la recompensa. Intenta de nuevo.',
        variant: 'destructive'
      });
    } finally {
      setRedeeming(false);
    }
  };

  const openRedeemConfirmation = (reward: RewardItem) => {
    setSelectedReward(reward);
    setShowConfirmDialog(true);
  };

  const getNextTier = () => {
    if (!customer || allTiers.length === 0) return null;
    const currentIndex = allTiers.findIndex(t => t.id === customer.tier_id);
    if (currentIndex < allTiers.length - 1) {
      return allTiers[currentIndex + 1];
    }
    return null;
  };

  const getTierProgress = () => {
    const nextTier = getNextTier();
    if (!nextTier || !customer) return 100;
    const currentTier = customer.tier;
    const currentMin = currentTier?.min_points || 0;
    const nextMin = nextTier.min_points;
    const progress = ((customer.lifetime_points - currentMin) / (nextMin - currentMin)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const rewardTypeLabels: Record<string, string> = {
    discount_percent: 'Descuento %',
    discount_fixed: 'Descuento $',
    free_item: 'Producto Gratis',
    free_delivery: 'Delivery Gratis',
    experience: 'Experiencia',
    upgrade: 'Upgrade',
  };

  const statusLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    pending: { label: 'Pendiente', icon: <Clock className="w-4 h-4" />, color: 'text-yellow-600' },
    redeemed: { label: 'Canjeado', icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-green-600' },
    expired: { label: 'Expirado', icon: <XCircle className="w-4 h-4" />, color: 'text-red-600' },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Cargando tu perfil...</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold mb-2">Código no encontrado</h2>
            <p className="text-muted-foreground">
              {error || 'No pudimos encontrar tu perfil de fidelidad con este código.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const nextTier = getNextTier();
  const tierProgress = getTierProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 pb-20">
        <div className="max-w-lg mx-auto text-center">
          <Crown className="w-12 h-12 mx-auto mb-3 opacity-90" />
          <h1 className="text-2xl font-bold mb-1">Mi Fidelidad</h1>
          <p className="opacity-80">Bienvenido, {customer.customer_name}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-lg mx-auto px-4 -mt-14 pb-8 space-y-4">
        {/* Points Card */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Puntos disponibles</p>
                <p className="text-4xl font-bold text-primary">{customer.current_points.toLocaleString()}</p>
              </div>
              {customer.tier && (
                <Badge 
                  className="text-white font-semibold px-4 py-2"
                  style={{ backgroundColor: customer.tier.color }}
                >
                  <Star className="w-4 h-4 mr-1" />
                  {customer.tier.name}
                </Badge>
              )}
            </div>

            {/* Tier Progress */}
            {nextTier && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progreso al siguiente nivel</span>
                  <span className="font-medium" style={{ color: nextTier.color }}>
                    {nextTier.name}
                  </span>
                </div>
                <Progress value={tierProgress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{customer.lifetime_points.toLocaleString()} pts acumulados</span>
                  <span>{nextTier.min_points.toLocaleString()} pts requeridos</span>
                </div>
              </div>
            )}

            {/* Tier Benefits */}
            {customer.tier?.benefits && customer.tier.benefits.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Beneficios de tu nivel
                </p>
                <ul className="space-y-1">
                  {customer.tier.benefits.map((benefit, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{customer.total_orders}</p>
              <p className="text-xs text-muted-foreground">Órdenes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Coins className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
              <p className="text-lg font-bold">{customer.lifetime_points.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Pts totales</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Trophy className="w-5 h-5 mx-auto mb-1 text-orange-500" />
              <p className="text-lg font-bold">${customer.total_spent.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="rewards" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rewards">
              <Gift className="w-4 h-4 mr-1" />
              Canjear
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="w-4 h-4 mr-1" />
              Historial
            </TabsTrigger>
            <TabsTrigger value="my-rewards">
              <Star className="w-4 h-4 mr-1" />
              Mis Premios
            </TabsTrigger>
          </TabsList>

          {/* Available Rewards */}
          <TabsContent value="rewards" className="space-y-3 mt-4">
            {availableRewards.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Gift className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No hay recompensas disponibles ahora</p>
                </CardContent>
              </Card>
            ) : (
              availableRewards.map(reward => {
                const canRedeem = customer.current_points >= reward.points_required;
                return (
                  <Card key={reward.id} className={cn(
                    "transition-all",
                    !canRedeem && "opacity-60"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{reward.name}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {rewardTypeLabels[reward.reward_type]}
                            </Badge>
                          </div>
                          {reward.description && (
                            <p className="text-sm text-muted-foreground mb-2">{reward.description}</p>
                          )}
                          <div className="flex items-center gap-1 text-primary font-bold">
                            <Coins className="w-4 h-4" />
                            {reward.points_required.toLocaleString()} pts
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          disabled={!canRedeem}
                          className="ml-3"
                          onClick={() => canRedeem && openRedeemConfirmation(reward)}
                        >
                          {canRedeem ? 'Canjear' : (
                            <span className="flex items-center gap-1">
                              <ArrowUp className="w-3 h-3" />
                              {(reward.points_required - customer.current_points).toLocaleString()}
                            </span>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* Transaction History */}
          <TabsContent value="history" className="space-y-2 mt-4">
            {transactions.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <History className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">Sin transacciones aún</p>
                </CardContent>
              </Card>
            ) : (
              transactions.map(tx => (
                <Card key={tx.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{tx.description || 'Transacción'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString('es', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <span className={cn(
                      "font-bold",
                      tx.transaction_type === 'earn' ? "text-green-600" : "text-red-600"
                    )}>
                      {tx.transaction_type === 'earn' ? '+' : '-'}{tx.points}
                    </span>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* My Redeemed Rewards */}
          <TabsContent value="my-rewards" className="space-y-3 mt-4">
            {redeemedRewards.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Star className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No has canjeado premios aún</p>
                </CardContent>
              </Card>
            ) : (
              redeemedRewards.map(reward => {
                const status = statusLabels[reward.status] || statusLabels.pending;
                return (
                  <Card key={reward.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{reward.reward?.name || 'Recompensa'}</h3>
                          <p className="text-sm text-muted-foreground">
                            {reward.redeemed_at && new Date(reward.redeemed_at).toLocaleDateString('es', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                          {reward.redemption_code && reward.status === 'pending' && (
                            <div className="mt-2 p-2 bg-primary/10 rounded text-center">
                              <p className="text-xs text-muted-foreground">Código de canje</p>
                              <p className="font-mono font-bold text-primary">{reward.redemption_code}</p>
                            </div>
                          )}
                        </div>
                        <Badge variant="outline" className={cn("flex items-center gap-1", status.color)}>
                          {status.icon}
                          {status.label}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Confirmar Canje
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de canjear esta recompensa?
            </DialogDescription>
          </DialogHeader>

          {selectedReward && (
            <div className="py-4">
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <h3 className="font-semibold text-lg">{selectedReward.name}</h3>
                {selectedReward.description && (
                  <p className="text-sm text-muted-foreground">{selectedReward.description}</p>
                )}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Puntos a usar:</span>
                  <span className="font-bold text-primary flex items-center gap-1">
                    <Coins className="w-4 h-4" />
                    {selectedReward.points_required.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Puntos restantes:</span>
                  <span className="font-medium">
                    {(customer!.current_points - selectedReward.points_required).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button 
              onClick={handleRedeemReward} 
              disabled={redeeming}
              className="w-full"
            >
              {redeeming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Canjeando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmar Canje
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
              disabled={redeeming}
              className="w-full"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-sm">
          <div className="text-center py-4">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <PartyPopper className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">¡Felicidades!</h2>
            <p className="text-muted-foreground mb-4">
              Has canjeado exitosamente tu recompensa
            </p>

            {selectedReward && (
              <div className="p-4 bg-muted rounded-lg mb-4">
                <p className="font-semibold">{selectedReward.name}</p>
              </div>
            )}

            {redemptionResult && (
              <div className="space-y-3">
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Tu código de canje</p>
                  <p className="text-2xl font-mono font-bold text-primary tracking-wider">
                    {redemptionResult.code}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Válido hasta el{' '}
                  {new Date(redemptionResult.expiresAt).toLocaleDateString('es', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  Muestra este código al momento de tu compra
                </p>
              </div>
            )}

            <Button 
              className="w-full mt-6"
              onClick={() => {
                setShowSuccessDialog(false);
                setSelectedReward(null);
                setRedemptionResult(null);
              }}
            >
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicLoyalty;
