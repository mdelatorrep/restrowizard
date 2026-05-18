import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PreOpeningTask } from '@/hooks/usePreOpeningTasks';
import { getCategoryColor, getCategoryIcon, getTaskModuleAction } from './preOpeningHelpers';

interface TaskItemProps {
  task: PreOpeningTask;
  onToggle: () => void;
  daysUntilOpening: number;
  isOverdue?: boolean;
  isMobile?: boolean;
}

export const PreOpeningTaskItem: React.FC<TaskItemProps> = ({ task, onToggle, daysUntilOpening, isMobile }) => {
  const navigate = useNavigate();
  const Icon = getCategoryIcon(task.category);
  const shouldBeDone = task.days_before_opening >= daysUntilOpening;
  const moduleAction = getTaskModuleAction(task);

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (moduleAction) navigate(moduleAction.path);
  };

  return (
    <div
      className={`flex flex-col gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border transition-all overflow-hidden
        ${task.is_completed ? 'bg-muted/50 border-muted' : shouldBeDone ? 'bg-warning/5 border-warning/30' : 'bg-card border-border hover:border-primary/50'}
      `}
    >
      <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0 overflow-hidden">
        <div
          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center cursor-pointer flex-shrink-0 mt-0.5
            ${task.is_completed ? 'bg-success border-success' : 'border-muted-foreground hover:border-primary'}
          `}
          onClick={onToggle}
        >
          {task.is_completed && <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-success-foreground" />}
        </div>

        <div className={`p-1.5 sm:p-2 rounded-lg ${getCategoryColor(task.category)} flex-shrink-0`}>
          <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <p className={`font-medium text-xs sm:text-sm leading-tight ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
            {typeof task.title === 'string' ? task.title : JSON.stringify(task.title)}
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 sm:truncate mt-0.5">
            {typeof task.description === 'string' ? task.description : task.description ? JSON.stringify(task.description) : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-7 sm:ml-11 flex-shrink-0">
        <Badge variant={shouldBeDone && !task.is_completed ? 'destructive' : 'outline'} className="flex-shrink-0 text-[9px] sm:text-xs px-1.5 sm:px-2 py-0.5">
          {task.days_before_opening}d antes
        </Badge>

        {moduleAction && !task.is_completed && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleActionClick}
            className="gap-1 text-[10px] sm:text-xs whitespace-nowrap h-6 sm:h-7 px-2 sm:px-2.5"
          >
            <moduleAction.icon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            {!isMobile && <span className="hidden md:inline">{moduleAction.label}</span>}
            <ArrowRight className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};
