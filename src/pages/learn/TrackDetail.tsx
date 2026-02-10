import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLearnData } from '@/hooks/useLearnData';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CourseCard from '@/components/learn/CourseCard';
import ProgressRing from '@/components/learn/ProgressRing';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Clock, BookOpen, Users, CheckCircle2 } from 'lucide-react';

const difficultyLabels: Record<string, string> = { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' };

const TrackDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enrollInCourse, myEnrollments } = useLearnData();

  const { data: track, isLoading: trackLoading } = useQuery({
    queryKey: ['track-detail', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_tracks')
        .select('*')
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: trackCourses = [] } = useQuery({
    queryKey: ['track-courses', track?.id],
    enabled: !!track?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_track_courses')
        .select('*, training_courses(*)')
        .eq('track_id', track!.id)
        .order('order_index');
      if (error) throw error;
      return data;
    },
  });

  const enrollmentMap = new Map(myEnrollments.map((e: any) => [e.course_id, e]));
  const enrolledCount = trackCourses.filter((tc: any) => enrollmentMap.has(tc.course_id)).length;
  const completedCount = trackCourses.filter((tc: any) => enrollmentMap.get(tc.course_id)?.completed_at).length;
  const trackProgress = trackCourses.length > 0 ? (completedCount / trackCourses.length) * 100 : 0;

  if (trackLoading) return <div className="min-h-screen bg-background"><Header /><div className="pt-28 text-center text-muted-foreground">Cargando...</div></div>;
  if (!track) return <div className="min-h-screen bg-background"><Header /><div className="pt-28 text-center text-muted-foreground">Ruta no encontrada</div></div>;

  const handleEnrollAll = () => {
    if (!user) { navigate('/auth'); return; }
    trackCourses.forEach((tc: any) => {
      if (!enrollmentMap.has(tc.course_id)) enrollInCourse.mutate(tc.course_id);
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="pt-28 pb-12 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="container mx-auto px-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/learn')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />Volver
          </Button>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-5xl">{track.icon_emoji || '🎓'}</span>
                <div>
                  <Badge variant="outline">{difficultyLabels[track.difficulty] || track.difficulty}</Badge>
                  {track.target_role && <Badge variant="outline" className="ml-2">{track.target_role}</Badge>}
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-headline text-foreground mb-4">{track.title}</h1>
              <p className="text-muted-foreground text-lg mb-6">{track.description || track.short_description}</p>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" />{track.courses_count} cursos</span>
                {track.estimated_weeks && <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{track.estimated_weeks} semanas</span>}
                <span className="flex items-center gap-1"><Users className="h-4 w-4" />{track.enrollments_count.toLocaleString()} inscritos</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-4">
              {enrolledCount > 0 ? (
                <>
                  <ProgressRing progress={trackProgress} size={120} strokeWidth={8} />
                  <p className="text-sm text-muted-foreground">{completedCount}/{trackCourses.length} cursos completados</p>
                </>
              ) : (
                <Button size="lg" onClick={handleEnrollAll}>Iniciar esta Ruta</Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-6">
          <h2 className="text-xl font-headline text-foreground mb-6">Cursos incluidos ({trackCourses.length})</h2>
          <div className="space-y-4">
            {trackCourses.map((tc: any, i: number) => {
              const enrollment = enrollmentMap.get(tc.course_id);
              const isCompleted = !!enrollment?.completed_at;
              return (
                <Card key={tc.id} className={`border ${isCompleted ? 'border-green-200 bg-green-50/30' : 'border-border'}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-headline">
                      {isCompleted ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : i + 1}
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/learn/course/${tc.course_id}`)}>
                      <h3 className="font-medium text-foreground truncate">{tc.training_courses?.title}</h3>
                      <p className="text-xs text-muted-foreground">{tc.training_courses?.short_description}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {tc.training_courses?.duration_hours && <span>{tc.training_courses.duration_hours}h</span>}
                        {tc.training_courses?.lessons_count > 0 && <span>{tc.training_courses.lessons_count} lecciones</span>}
                        {!tc.is_mandatory && <Badge variant="outline" className="text-[10px]">Opcional</Badge>}
                      </div>
                    </div>
                    {enrollment && !isCompleted && (
                      <div className="shrink-0">
                        <Badge variant="secondary">{enrollment.progress_percent || 0}%</Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default TrackDetail;
