import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLessonProgress } from '@/hooks/useLessonProgress';
import LessonSidebar from '@/components/learn/LessonSidebar';
import QuizComponent from '@/components/learn/QuizComponent';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const LessonViewer = () => {
  const { id: courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isLessonCompleted, markComplete, completedCount } = useLessonProgress(courseId);

  const { data: course } = useQuery({
    queryKey: ['course-for-lesson', courseId],
    queryFn: async () => {
      const { data, error } = await supabase.from('training_courses').select('title').eq('id', courseId!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['course-lessons', courseId],
    queryFn: async () => {
      const { data, error } = await supabase.from('course_lessons').select('*').eq('course_id', courseId!).order('order_index');
      if (error) throw error;
      return data;
    },
  });

  const currentLesson = lessons.find((l: any) => l.id === lessonId);
  const currentIndex = lessons.findIndex((l: any) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;
  const completed = lessonId ? isLessonCompleted(lessonId) : false;
  const completedLessons = lessons.filter((l: any) => isLessonCompleted(l.id)).map((l: any) => l.id);
  const progress = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;

  const handleToggleComplete = () => {
    if (!lessonId || completed) return;
    markComplete.mutate({ lessonId });
  };

  const handleQuizComplete = (score: number) => {
    if (!lessonId) return;
    markComplete.mutate({ lessonId, quizScore: score });
  };

  if (!currentLesson) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Lección no encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="hidden lg:block">
        <LessonSidebar
          lessons={lessons}
          currentLessonId={lessonId}
          completedLessons={completedLessons}
          onSelect={id => navigate(`/learn/course/${courseId}/lesson/${id}`)}
          courseTitle={course?.title || ''}
          progress={progress}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="sticky top-0 z-20 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/learn/course/${courseId}`)}>
            <ArrowLeft className="h-4 w-4 mr-1" />Volver al curso
          </Button>
          <div className="flex items-center gap-2">
            {completed && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            <span className="text-sm text-muted-foreground">{currentIndex + 1}/{lessons.length}</span>
          </div>
        </div>

        {/* Lesson content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-8">
            <h1 className="text-2xl font-headline text-foreground mb-6">{currentLesson.title}</h1>

            {currentLesson.video_url && (
              <div className="aspect-video mb-8 rounded-lg overflow-hidden bg-muted">
                <iframe src={currentLesson.video_url} className="w-full h-full" allowFullScreen title={currentLesson.title} />
              </div>
            )}

            {currentLesson.content_type === 'quiz' && currentLesson.quiz_data ? (
              <QuizComponent
                questions={(currentLesson.quiz_data as any)?.questions || []}
                onComplete={handleQuizComplete}
              />
            ) : currentLesson.content ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentLesson.content}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-12">Esta lección aún no tiene contenido.</p>
            )}

            {/* Completion checkbox */}
            {user && currentLesson.content_type !== 'quiz' && (
              <div className="mt-8 p-4 bg-muted/50 rounded-lg flex items-center gap-3">
                <Checkbox checked={completed} onCheckedChange={() => handleToggleComplete()} disabled={completed} />
                <span className="text-sm text-foreground">{completed ? 'Lección completada ✓' : 'Marcar como completada'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom navigation */}
        <div className="border-t border-border bg-card px-6 py-4 flex items-center justify-between">
          <Button variant="outline" disabled={!prevLesson} onClick={() => prevLesson && navigate(`/learn/course/${courseId}/lesson/${prevLesson.id}`)}>
            <ArrowLeft className="h-4 w-4 mr-1" />Anterior
          </Button>
          <Button disabled={!nextLesson} onClick={() => nextLesson && navigate(`/learn/course/${courseId}/lesson/${nextLesson.id}`)}>
            Siguiente<ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LessonViewer;
