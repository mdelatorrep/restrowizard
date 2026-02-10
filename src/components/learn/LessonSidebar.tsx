import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, Circle, PlayCircle, FileText, HelpCircle, Bot, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Lesson {
  id: string;
  title: string;
  content_type: string;
  duration_minutes: number;
  is_free_preview: boolean | null;
  order_index: number;
}

interface LessonSidebarProps {
  lessons: Lesson[];
  currentLessonId?: string;
  completedLessons: string[];
  onSelect: (lessonId: string) => void;
  courseTitle: string;
  progress: number;
}

const typeIcons: Record<string, React.ReactNode> = {
  text: <FileText className="h-4 w-4" />,
  video: <PlayCircle className="h-4 w-4" />,
  quiz: <HelpCircle className="h-4 w-4" />,
  ai_interactive: <Bot className="h-4 w-4" />,
};

const LessonSidebar: React.FC<LessonSidebarProps> = ({ lessons, currentLessonId, completedLessons, onSelect, courseTitle, progress }) => (
  <div className="w-full lg:w-80 border-r border-border bg-card">
    <div className="p-4 border-b border-border">
      <h3 className="font-headline text-sm truncate">{courseTitle}</h3>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
      </div>
    </div>
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="p-2 space-y-1">
        {lessons.map((lesson, i) => {
          const isCompleted = completedLessons.includes(lesson.id);
          const isCurrent = lesson.id === currentLessonId;
          return (
            <button key={lesson.id} onClick={() => onSelect(lesson.id)}
              className={`w-full text-left p-3 rounded-lg flex items-start gap-3 transition-all text-sm ${
                isCurrent ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50'
              }`}>
              <div className="mt-0.5 shrink-0">
                {isCompleted ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">{typeIcons[lesson.content_type] || typeIcons.text}</span>
                  <span className={`truncate ${isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                    {i + 1}. {lesson.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{lesson.duration_minutes} min</span>
                  {lesson.is_free_preview && <Badge variant="outline" className="text-[10px] px-1 py-0"><Eye className="h-2 w-2 mr-0.5" />Gratis</Badge>}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  </div>
);

export default LessonSidebar;
