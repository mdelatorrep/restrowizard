import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLearnData } from '@/hooks/useLearnData';
import { useLessonProgress } from '@/hooks/useLessonProgress';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Clock, Users, Star, BookOpen, PlayCircle, CheckCircle2, Circle, FileText, HelpCircle, Bot, Eye } from 'lucide-react';

const levelLabels: Record<string, string> = { entry: 'Principiante', junior: 'Junior', mid: 'Intermedio', senior: 'Avanzado', executive: 'Experto' };

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enrollInCourse, myEnrollments } = useLearnData();
  const { completedCount, isLessonCompleted } = useLessonProgress(id);

  const { data: course, isLoading } = useQuery({
    queryKey: ['course-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('training_courses').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['course-lessons', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('course_lessons').select('*').eq('course_id', id!).order('order_index');
      if (error) throw error;
      return data;
    },
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['course-reviews', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('course_reviews').select('*').eq('course_id', id!).order('created_at', { ascending: false }).limit(10);
      if (error) throw error;
      return data;
    },
  });

  const enrollment = myEnrollments.find((e: any) => e.course_id === id);
  const progress = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;

  const typeIcons: Record<string, React.ReactNode> = {
    text: <FileText className="h-4 w-4" />, video: <PlayCircle className="h-4 w-4" />,
    quiz: <HelpCircle className="h-4 w-4" />, ai_interactive: <Bot className="h-4 w-4" />,
  };

  if (isLoading) return <div className="min-h-screen bg-background"><Header /><div className="pt-28 text-center text-muted-foreground">Cargando...</div></div>;
  if (!course) return <div className="min-h-screen bg-background"><Header /><div className="pt-28 text-center text-muted-foreground">Curso no encontrado</div></div>;

  const handleEnroll = () => {
    if (!user) { navigate('/auth'); return; }
    enrollInCourse.mutate(course.id);
  };

  const getNextLesson = () => {
    return lessons.find(l => !isLessonCompleted(l.id)) || lessons[0];
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="pt-28 pb-12 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="container mx-auto px-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/learn')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />Volver
          </Button>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Badge variant="outline" className="mb-3">{levelLabels[course.level] || course.level}</Badge>
              <h1 className="text-3xl font-headline text-foreground mb-4">{course.title}</h1>
              <p className="text-muted-foreground text-lg mb-6">{course.description}</p>
              {course.instructor_name && (
                <div className="flex items-center gap-3 mb-4">
                  {course.instructor_photo_url && <img src={course.instructor_photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />}
                  <div>
                    <p className="text-sm font-medium text-foreground">{course.instructor_name}</p>
                    {course.instructor_bio && <p className="text-xs text-muted-foreground line-clamp-1">{course.instructor_bio}</p>}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                {course.duration_hours && <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{course.duration_hours}h</span>}
                <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" />{lessons.length} lecciones</span>
                <span className="flex items-center gap-1"><Users className="h-4 w-4" />{(course.enrollments_count || 0).toLocaleString()}</span>
                {(course.average_rating ?? 0) > 0 && <span className="flex items-center gap-1 text-yellow-500"><Star className="h-4 w-4 fill-current" />{course.average_rating?.toFixed(1)}</span>}
              </div>
            </div>
            <Card className="shadow-lg">
              <CardContent className="p-6 space-y-4">
                <div className="text-3xl font-headline text-primary">{course.is_free ? 'Gratis' : `$${course.price?.toLocaleString()}`}</div>
                {enrollment ? (
                  <>
                    <Progress value={progress} className="h-3" />
                    <p className="text-sm text-muted-foreground">{Math.round(progress)}% completado</p>
                    <Button className="w-full" size="lg" onClick={() => { const next = getNextLesson(); if (next) navigate(`/learn/course/${id}/lesson/${next.id}`); }}>
                      Continuar Aprendiendo
                    </Button>
                  </>
                ) : (
                  <Button className="w-full" size="lg" onClick={handleEnroll} disabled={enrollInCourse.isPending}>
                    {enrollInCourse.isPending ? 'Inscribiendo...' : 'Inscribirme'}
                  </Button>
                )}
                {(course as any).what_you_learn && (course as any).what_you_learn.length > 0 && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Lo que aprenderás:</h4>
                    <ul className="space-y-1">
                      {(course as any).what_you_learn.map((item: string, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Lessons index */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <h2 className="text-xl font-headline text-foreground mb-6">Contenido del curso ({lessons.length} lecciones)</h2>
          <div className="space-y-2 max-w-3xl">
            {lessons.map((lesson: any, i: number) => {
              const completed = isLessonCompleted(lesson.id);
              const canAccess = enrollment || lesson.is_free_preview;
              return (
                <div key={lesson.id}
                  onClick={() => canAccess && navigate(`/learn/course/${id}/lesson/${lesson.id}`)}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${canAccess ? 'cursor-pointer hover:bg-muted/50' : 'opacity-60'} ${completed ? 'border-green-200 bg-green-50/30' : 'border-border'}`}>
                  <div className="shrink-0">
                    {completed ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <div className="shrink-0 text-muted-foreground">{typeIcons[lesson.content_type] || typeIcons.text}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{i + 1}. {lesson.title}</p>
                    <span className="text-xs text-muted-foreground">{lesson.duration_minutes} min</span>
                  </div>
                  {lesson.is_free_preview && <Badge variant="outline" className="text-[10px]"><Eye className="h-2.5 w-2.5 mr-0.5" />Preview</Badge>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-6">
            <h2 className="text-xl font-headline text-foreground mb-6">Reseñas ({reviews.length})</h2>
            <div className="grid md:grid-cols-2 gap-4 max-w-3xl">
              {reviews.map((r: any) => (
                <Card key={r.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-1 mb-2">
                      {[1,2,3,4,5].map(s => <Star key={s} className={`h-4 w-4 ${s <= r.rating ? 'text-yellow-500 fill-current' : 'text-muted'}`} />)}
                    </div>
                    {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default CourseDetail;
