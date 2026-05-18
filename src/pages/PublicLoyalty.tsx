import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crown, Award, Gift, History, Star } from 'lucide-react';
import { usePublicLoyalty } from '@/hooks/usePublicLoyalty';
import { LoyaltyPointsCard } from '@/components/loyalty-public/LoyaltyPointsCard';
import { LoyaltyStatsGrid } from '@/components/loyalty-public/LoyaltyStatsGrid';
import { LoyaltyAchievementsTab } from '@/components/loyalty-public/LoyaltyAchievementsTab';
import { LoyaltyRewardsTab } from '@/components/loyalty-public/LoyaltyRewardsTab';
import { LoyaltyHistoryTab } from '@/components/loyalty-public/LoyaltyHistoryTab';
import { LoyaltyMyRewardsTab } from '@/components/loyalty-public/LoyaltyMyRewardsTab';
import { RedeemConfirmDialog } from '@/components/loyalty-public/RedeemConfirmDialog';
import { RedeemSuccessDialog } from '@/components/loyalty-public/RedeemSuccessDialog';
import type { RewardItem } from '@/components/loyalty-public/loyaltyTypes';

const PublicLoyalty = () => {
  const { codigo } = useParams<{ codigo: string }>();
  const {
    customer, transactions, availableRewards, redeemedRewards,
    achievements, unlockedAchievements, allTiers, loading, error,
    redeemReward,
  } = usePublicLoyalty(codigo);

  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [redemptionResult, setRedemptionResult] = useState<{ code: string; expiresAt: string } | null>(null);

  const handleRedeem = async () => {
    if (!selectedReward) return;
    setRedeeming(true);
    const result = await redeemReward(selectedReward);
    setRedeeming(false);
    if (result) {
      setRedemptionResult(result);
      setShowConfirmDialog(false);
      setShowSuccessDialog(true);
    }
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

  const currentIndex = allTiers.findIndex(t => t.id === customer.tier_id);
  const nextTier = currentIndex >= 0 && currentIndex < allTiers.length - 1 ? allTiers[currentIndex + 1] : null;
  const tierProgress = (() => {
    if (!nextTier) return 100;
    const currentMin = customer.tier?.min_points || 0;
    const progress = ((customer.lifetime_points - currentMin) / (nextTier.min_points - currentMin)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 pb-20">
        <div className="max-w-lg mx-auto text-center">
          <Crown className="w-12 h-12 mx-auto mb-3 opacity-90" />
          <p className="text-sm opacity-70 mb-1">{customer.restaurant_name}</p>
          <h1 className="text-2xl font-bold mb-1">Mi Fidelidad</h1>
          <p className="opacity-80">Bienvenido, {customer.customer_name}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-14 pb-8 space-y-4">
        <LoyaltyPointsCard customer={customer} nextTier={nextTier} tierProgress={tierProgress} />
        <LoyaltyStatsGrid customer={customer} />

        <Tabs defaultValue="achievements" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="achievements" className="text-xs sm:text-sm">
              <Award className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Logros</span>
            </TabsTrigger>
            <TabsTrigger value="rewards" className="text-xs sm:text-sm">
              <Gift className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Canjear</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm">
              <History className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Historial</span>
            </TabsTrigger>
            <TabsTrigger value="my-rewards" className="text-xs sm:text-sm">
              <Star className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Premios</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="achievements">
            <LoyaltyAchievementsTab achievements={achievements} unlockedAchievements={unlockedAchievements} customer={customer} />
          </TabsContent>
          <TabsContent value="rewards">
            <LoyaltyRewardsTab rewards={availableRewards} customer={customer} onRedeem={(r) => { setSelectedReward(r); setShowConfirmDialog(true); }} />
          </TabsContent>
          <TabsContent value="history">
            <LoyaltyHistoryTab transactions={transactions} />
          </TabsContent>
          <TabsContent value="my-rewards">
            <LoyaltyMyRewardsTab rewards={redeemedRewards} />
          </TabsContent>
        </Tabs>
      </div>

      <RedeemConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        reward={selectedReward}
        customer={customer}
        redeeming={redeeming}
        onConfirm={handleRedeem}
      />
      <RedeemSuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        reward={selectedReward}
        result={redemptionResult}
        onClose={() => {
          setShowSuccessDialog(false);
          setSelectedReward(null);
          setRedemptionResult(null);
        }}
      />
    </div>
  );
};

export default PublicLoyalty;
