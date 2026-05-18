import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { differenceInDays, differenceInHours, differenceInMinutes, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { usePreOpeningTasks } from '@/hooks/usePreOpeningTasks';
import { useIsMobile } from '@/hooks/use-mobile';
import { PreOpeningHero } from './pre-opening/PreOpeningHero';
import { PreOpeningProgress } from './pre-opening/PreOpeningProgress';
import { PreOpeningTaskTabs } from './pre-opening/PreOpeningTaskTabs';

interface PreOpeningCountdownProps {
  businessName: string;
  openingDate: string;
  daysUntilOpening: number;
  projectId?: string;
}

export const PreOpeningCountdown: React.FC<PreOpeningCountdownProps> = ({
  businessName,
  openingDate,
  daysUntilOpening,
  projectId,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const {
    tasks,
    isLoading: isLoadingTasks,
    toggleTask,
    completedCount: completedTasks,
    progressPercent,
    getOverdueTasks,
    getUpcomingTasks,
    hasAIChecklist,
  } = usePreOpeningTasks(projectId);

  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });
  const [isConfirmingOpening, setIsConfirmingOpening] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      if (!openingDate) return;
      const target = parseISO(openingDate);
      const now = new Date();
      const days = differenceInDays(target, now);
      const hours = differenceInHours(target, now) % 24;
      const minutes = differenceInMinutes(target, now) % 60;
      setCountdown({ days: Math.max(0, days), hours: Math.max(0, hours), minutes: Math.max(0, minutes) });
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [openingDate]);

  const overdueTasks = getOverdueTasks(daysUntilOpening);
  const upcomingTasks = getUpcomingTasks(daysUntilOpening);

  const handleConfirmOpening = async () => {
    if (!user) return;
    setIsConfirmingOpening(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const client = supabase as any;
      const { data: businessData } = await client
        .from('restaurant_businesses')
        .select('id')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (businessData) {
        await client
          .from('restaurant_businesses')
          .update({ opening_date: todayStr })
          .eq('id', businessData.id);
      }

      toast({
        title: '🎉 ¡Felicidades!',
        description: 'Tu restaurante ha abierto oficialmente. ¡Bienvenido a los primeros 90 días!',
      });

      queryClient.invalidateQueries({ queryKey: ['restaurant-business'] });
      queryClient.invalidateQueries({ queryKey: ['restaurant-lifecycle'] });
      navigate('/r/first-90-days');
    } catch (error) {
      console.error('Error confirming opening:', error);
      toast({
        title: 'Error',
        description: 'No se pudo confirmar la apertura. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsConfirmingOpening(false);
    }
  };

  if (isLoadingTasks) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="text-muted-foreground">Cargando checklist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-8 pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
        <PreOpeningHero
          businessName={businessName}
          openingDate={openingDate}
          daysUntilOpening={daysUntilOpening}
          countdown={countdown}
          hasAIChecklist={hasAIChecklist}
          isConfirmingOpening={isConfirmingOpening}
          onConfirmOpening={handleConfirmOpening}
        />

        <PreOpeningProgress
          progressPercent={progressPercent}
          completedTasks={completedTasks}
          totalTasks={tasks.length}
          overdueCount={overdueTasks.length}
          upcomingCount={upcomingTasks.length}
        />

        <PreOpeningTaskTabs
          tasks={tasks}
          overdueTasks={overdueTasks}
          upcomingTasks={upcomingTasks}
          daysUntilOpening={daysUntilOpening}
          isMobile={!!isMobile}
          onToggle={toggleTask}
        />
      </div>
    </div>
  );
};

export default PreOpeningCountdown;
