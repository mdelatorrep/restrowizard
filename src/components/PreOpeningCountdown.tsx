import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Rocket, 
  CheckCircle2, 
  Clock, 
  PartyPopper,
  ChefHat,
  Users,
  Megaphone,
  ClipboardCheck,
  AlertTriangle,
  Sparkles,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, differenceInDays, differenceInHours, differenceInMinutes, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { usePreOpeningTasks, PreOpeningTask } from '@/hooks/usePreOpeningTasks';

interface PreOpeningCountdownProps {
  businessName: string;
  openingDate: string;
  daysUntilOpening: number;
  projectId?: string;
}

const getCategoryIcon = (category: PreOpeningTask['category']) => {
  switch (category) {
    case 'operations': return ChefHat;
    case 'marketing': return Megaphone;
    case 'team': return Users;
    case 'legal': return ClipboardCheck;
  }
};

const getCategoryColor = (category: PreOpeningTask['category']) => {
  switch (category) {
    case 'operations': return 'bg-primary/10 text-primary';
    case 'marketing': return 'bg-info/10 text-info';
    case 'team': return 'bg-warning/10 text-warning';
    case 'legal': return 'bg-destructive/10 text-destructive';
  }
};

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
  
  // Use persistent tasks from database
  const { 
    tasks, 
    isLoading: isLoadingTasks, 
    toggleTask, 
    completedCount: completedTasks, 
    progressPercent, 
    getOverdueTasks, 
    getUpcomingTasks 
  } = usePreOpeningTasks(projectId);
  
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });
  const [isConfirmingOpening, setIsConfirmingOpening] = useState(false);

  // Update countdown every minute
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

  // Computed task lists
  const overdueTasks = getOverdueTasks(daysUntilOpening);
  const upcomingTasks = getUpcomingTasks(daysUntilOpening);

  const handleConfirmOpening = async () => {
    if (!user) return;
    
    setIsConfirmingOpening(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      
      // Use type assertion to bypass strict typing for newly added column
      const client = supabase as any;
      const { data: businessData } = await client
        .from('restaurant_businesses')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .single();
      
      if (businessData) {
        await client
          .from('restaurant_businesses')
          .update({ opening_date: todayStr })
          .eq('id', businessData.id);
      }
      
      toast({
        title: "🎉 ¡Felicidades!",
        description: "Tu restaurante ha abierto oficialmente. ¡Bienvenido a los primeros 90 días!",
      });
      
      queryClient.invalidateQueries({ queryKey: ['restaurant-business'] });
      queryClient.invalidateQueries({ queryKey: ['restaurant-lifecycle'] });
      
      navigate('/r/first-90-days');
    } catch (error) {
      console.error('Error confirming opening:', error);
      toast({
        title: "Error",
        description: "No se pudo confirmar la apertura. Intenta de nuevo.",
        variant: "destructive",
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
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero Countdown */}
        <Card className="bg-gradient-to-br from-primary/10 via-background to-success/10 border-primary/20 overflow-hidden relative">
          <div className="absolute top-4 right-4">
            <Sparkles className="h-8 w-8 text-primary/30 animate-pulse" />
          </div>
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Rocket className="h-6 w-6 text-primary" />
              <Badge variant="outline" className="text-primary border-primary">
                Pre-Apertura
              </Badge>
            </div>
            <CardTitle className="text-3xl md:text-4xl font-headline text-primary">
              {businessName}
            </CardTitle>
            <CardDescription className="text-lg">
              Apertura programada: {format(parseISO(openingDate), "EEEE d 'de' MMMM, yyyy", { locale: es })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Countdown Display */}
            <div className="flex justify-center gap-4 md:gap-8 my-8">
              <div className="text-center">
                <div className="text-4xl md:text-6xl font-bold text-primary">{countdown.days}</div>
                <div className="text-sm text-muted-foreground">días</div>
              </div>
              <div className="text-4xl md:text-6xl font-bold text-muted-foreground">:</div>
              <div className="text-center">
                <div className="text-4xl md:text-6xl font-bold text-primary">{countdown.hours}</div>
                <div className="text-sm text-muted-foreground">horas</div>
              </div>
              <div className="text-4xl md:text-6xl font-bold text-muted-foreground">:</div>
              <div className="text-center">
                <div className="text-4xl md:text-6xl font-bold text-primary">{countdown.minutes}</div>
                <div className="text-sm text-muted-foreground">minutos</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {daysUntilOpening <= 0 ? (
                <Button 
                  size="lg" 
                  onClick={handleConfirmOpening}
                  disabled={isConfirmingOpening}
                  className="gap-2 bg-success hover:bg-success/90"
                >
                  <PartyPopper className="h-5 w-5" />
                  {isConfirmingOpening ? 'Confirmando...' : '¡Confirmar Apertura Oficial!'}
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => navigate('/r/new-business')}
                  className="gap-2"
                >
                  <ClipboardCheck className="h-5 w-5" />
                  Revisar Plan de Apertura
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Progress Overview */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Checklist Completado</span>
                <span className="text-2xl font-bold text-primary">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {completedTasks} de {tasks.length} tareas
              </p>
            </CardContent>
          </Card>
          
          <Card className={overdueTasks.length > 0 ? 'border-warning' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                {overdueTasks.length > 0 ? (
                  <AlertTriangle className="h-5 w-5 text-warning" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                )}
                <span className="text-sm font-medium">Tareas Pendientes</span>
              </div>
              <p className="text-2xl font-bold">
                {overdueTasks.length > 0 ? (
                  <span className="text-warning">{overdueTasks.length} atrasadas</span>
                ) : (
                  <span className="text-success">Al día</span>
                )}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-info" />
                <span className="text-sm font-medium">Próximas Tareas</span>
              </div>
              <p className="text-2xl font-bold text-info">{upcomingTasks.length}</p>
              <p className="text-xs text-muted-foreground">tareas por completar</p>
            </CardContent>
          </Card>
        </div>

        {/* Tasks Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Checklist de Pre-Apertura
            </CardTitle>
            <CardDescription>
              Tareas críticas para asegurar una apertura exitosa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="overdue" className="text-warning">
                  Atrasadas ({overdueTasks.length})
                </TabsTrigger>
                <TabsTrigger value="upcoming">Próximas</TabsTrigger>
                <TabsTrigger value="completed">Completadas</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-4 space-y-3">
                {tasks.map(task => (
                  <TaskItem key={task.id} task={task} onToggle={() => toggleTask(task.id)} daysUntilOpening={daysUntilOpening} />
                ))}
              </TabsContent>
              
              <TabsContent value="overdue" className="mt-4 space-y-3">
                {overdueTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-success" />
                    <p>¡Excelente! No tienes tareas atrasadas</p>
                  </div>
                ) : (
                  overdueTasks.map(task => (
                    <TaskItem key={task.id} task={task} onToggle={() => toggleTask(task.id)} daysUntilOpening={daysUntilOpening} isOverdue />
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="upcoming" className="mt-4 space-y-3">
                {upcomingTasks.map(task => (
                  <TaskItem key={task.id} task={task} onToggle={() => toggleTask(task.id)} daysUntilOpening={daysUntilOpening} />
                ))}
              </TabsContent>
              
              <TabsContent value="completed" className="mt-4 space-y-3">
                {tasks.filter(t => t.is_completed).map(task => (
                  <TaskItem key={task.id} task={task} onToggle={() => toggleTask(task.id)} daysUntilOpening={daysUntilOpening} />
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface TaskItemProps {
  task: PreOpeningTask;
  onToggle: () => void;
  daysUntilOpening: number;
  isOverdue?: boolean;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, daysUntilOpening, isOverdue }) => {
  const Icon = getCategoryIcon(task.category);
  const shouldBeDone = task.days_before_opening >= daysUntilOpening;
  
  return (
    <div 
      className={`flex items-center gap-4 p-4 rounded-lg border transition-all cursor-pointer
        ${task.is_completed ? 'bg-muted/50 border-muted' : shouldBeDone ? 'bg-warning/5 border-warning/30' : 'bg-card border-border hover:border-primary/50'}
      `}
      onClick={onToggle}
    >
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
        ${task.is_completed ? 'bg-success border-success' : 'border-muted-foreground'}
      `}>
        {task.is_completed && <CheckCircle2 className="h-4 w-4 text-success-foreground" />}
      </div>
      
      <div className={`p-2 rounded-lg ${getCategoryColor(task.category)}`}>
        <Icon className="h-4 w-4" />
      </div>
      
      <div className="flex-1">
        <p className={`font-medium ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
          {task.title}
        </p>
        <p className="text-sm text-muted-foreground">{task.description}</p>
      </div>
      
      <Badge variant={shouldBeDone && !task.is_completed ? 'destructive' : 'outline'}>
        {task.days_before_opening} días antes
      </Badge>
    </div>
  );
};

export default PreOpeningCountdown;
