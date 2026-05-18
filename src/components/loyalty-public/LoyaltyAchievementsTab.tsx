import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Award, Lock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAchievementIcon, achievementTypeLabels } from './loyaltyConstants';
import type { Achievement, CustomerAchievement, LoyaltyCustomer } from './loyaltyTypes';

interface Props {
  achievements: Achievement[];
  unlockedAchievements: CustomerAchievement[];
  customer: LoyaltyCustomer;
}

export const LoyaltyAchievementsTab = ({ achievements, unlockedAchievements, customer }: Props) => {
  const isUnlocked = (id: string) => unlockedAchievements.some(ua => ua.achievement_id === id);

  const getProgress = (a: Achievement) => {
    let v = 0;
    if (a.achievement_type === 'orders_count') v = customer.total_orders;
    else if (a.achievement_type === 'total_spent') v = customer.total_spent;
    return Math.min((v / a.threshold) * 100, 100);
  };

  return (
    <div className="space-y-4 mt-4">
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Logros desbloqueados</p>
              <p className="text-2xl font-bold">{unlockedAchievements.length} / {achievements.length}</p>
            </div>
            <div className="flex -space-x-2">
              {achievements.slice(0, 4).map(a => {
                const unlocked = isUnlocked(a.id);
                return (
                  <div key={a.id} className={cn(
                    'w-10 h-10 rounded-full border-2 border-background flex items-center justify-center',
                    unlocked ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}>
                    {unlocked ? getAchievementIcon(a.icon) : <Lock className="w-4 h-4" />}
                  </div>
                );
              })}
              {achievements.length > 4 && (
                <div className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                  +{achievements.length - 4}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {achievements.length === 0 ? (
        <Card><CardContent className="p-6 text-center">
          <Award className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No hay logros disponibles</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {achievements.map(a => {
            const unlocked = isUnlocked(a.id);
            const progress = getProgress(a);
            const unlockedData = unlockedAchievements.find(ua => ua.achievement_id === a.id);
            return (
              <Card key={a.id} className={cn('transition-all overflow-hidden', unlocked && 'border-primary/50 bg-primary/5')}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className={cn(
                      'w-14 h-14 rounded-full flex items-center justify-center shrink-0 relative',
                      unlocked ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg' : 'bg-muted text-muted-foreground'
                    )}>
                      {unlocked ? (
                        <>
                          {getAchievementIcon(a.icon)}
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                        </>
                      ) : <Lock className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className={cn('font-semibold', unlocked && 'text-primary')}>{a.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{a.description}</p>
                        </div>
                        <Badge variant={unlocked ? 'default' : 'secondary'} className="shrink-0">+{a.bonus_points} pts</Badge>
                      </div>
                      {!unlocked && (
                        <div className="mt-3 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{achievementTypeLabels[a.achievement_type]}</span>
                            <span className="font-medium">{Math.round(progress)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                          <p className="text-xs text-muted-foreground">Meta: {a.threshold.toLocaleString()}</p>
                        </div>
                      )}
                      {unlocked && unlockedData && (
                        <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                          Desbloqueado el {new Date(unlockedData.unlocked_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
