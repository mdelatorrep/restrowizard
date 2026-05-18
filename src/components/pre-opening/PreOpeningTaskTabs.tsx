import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardCheck, CheckCircle2 } from 'lucide-react';
import { PreOpeningTask } from '@/hooks/usePreOpeningTasks';
import { PreOpeningTaskItem } from './PreOpeningTaskItem';

interface Props {
  tasks: PreOpeningTask[];
  overdueTasks: PreOpeningTask[];
  upcomingTasks: PreOpeningTask[];
  daysUntilOpening: number;
  isMobile: boolean;
  onToggle: (id: string) => void;
}

export const PreOpeningTaskTabs: React.FC<Props> = ({
  tasks, overdueTasks, upcomingTasks, daysUntilOpening, isMobile, onToggle,
}) => (
  <Card>
    <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
        <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5" />
        Checklist de Pre-Apertura
      </CardTitle>
      <CardDescription className="text-xs sm:text-sm">
        Tareas críticas para asegurar una apertura exitosa
      </CardDescription>
    </CardHeader>
    <CardContent className="px-3 sm:px-6 pb-4">
      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-4 h-9 sm:h-10">
          <TabsTrigger value="all" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2">Todas</TabsTrigger>
          <TabsTrigger value="overdue" className="text-warning text-[10px] sm:text-xs md:text-sm px-1 sm:px-2">
            <span className="hidden sm:inline">Atrasadas</span>
            <span className="sm:hidden">Atras.</span>
            <span className="ml-0.5">({overdueTasks.length})</span>
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2">
            <span className="hidden sm:inline">Próximas</span>
            <span className="sm:hidden">Próx.</span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2">
            <span className="hidden sm:inline">Completadas</span>
            <span className="sm:hidden">Listas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
          {tasks.map(task => (
            <PreOpeningTaskItem key={task.id} task={task} onToggle={() => onToggle(task.id)} daysUntilOpening={daysUntilOpening} isMobile={isMobile} />
          ))}
        </TabsContent>

        <TabsContent value="overdue" className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
          {overdueTasks.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 text-success" />
              <p className="text-xs sm:text-sm">¡Excelente! No tienes tareas atrasadas</p>
            </div>
          ) : (
            overdueTasks.map(task => (
              <PreOpeningTaskItem key={task.id} task={task} onToggle={() => onToggle(task.id)} daysUntilOpening={daysUntilOpening} isOverdue isMobile={isMobile} />
            ))
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
          {upcomingTasks.map(task => (
            <PreOpeningTaskItem key={task.id} task={task} onToggle={() => onToggle(task.id)} daysUntilOpening={daysUntilOpening} isMobile={isMobile} />
          ))}
        </TabsContent>

        <TabsContent value="completed" className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
          {tasks.filter(t => t.is_completed).map(task => (
            <PreOpeningTaskItem key={task.id} task={task} onToggle={() => onToggle(task.id)} daysUntilOpening={daysUntilOpening} isMobile={isMobile} />
          ))}
        </TabsContent>
      </Tabs>
    </CardContent>
  </Card>
);
