import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLearnData } from '@/hooks/useLearnData';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CourseCard from '@/components/learn/CourseCard';
import ProgressRing from '@/components/learn/ProgressRing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, BookOpen, Clock, Trophy, ArrowLeft } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { myEnrollments, myCertificates } = useLearnData();

  if (!user) return <Navigate to="/auth" />;

  const activeCourses = myEnrollments.filter((e: any) => !e.completed_at);
  const completedCourses = myEnrollments.filter((e: any) => e.completed_at);
  const totalHours = myEnrollments.reduce((s: number, e: any) => s + (e.training_courses?.duration_hours || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-28 pb-16">
        <div className="container mx-auto px-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/learn')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />Volver a RestroLearn
          </Button>

          <h1 className="text-3xl font-headline text-foreground mb-8">Mi Progreso</h1>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card><CardContent className="p-4 text-center"><BookOpen className="h-6 w-6 text-primary mx-auto mb-2" /><div className="text-2xl font-headline text-foreground">{myEnrollments.length}</div><div className="text-xs text-muted-foreground">Cursos inscritos</div></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><Trophy className="h-6 w-6 text-green-600 mx-auto mb-2" /><div className="text-2xl font-headline text-foreground">{completedCourses.length}</div><div className="text-xs text-muted-foreground">Completados</div></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" /><div className="text-2xl font-headline text-foreground">{totalHours}h</div><div className="text-xs text-muted-foreground">Horas de estudio</div></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><Award className="h-6 w-6 text-yellow-600 mx-auto mb-2" /><div className="text-2xl font-headline text-foreground">{myCertificates.length}</div><div className="text-xs text-muted-foreground">Certificados</div></CardContent></Card>
          </div>

          {/* Active courses */}
          {activeCourses.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-headline text-foreground mb-4">Cursos Activos</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeCourses.map((e: any) => (
                  <CourseCard key={e.id} course={e.training_courses} enrollment={e} />
                ))}
              </div>
            </div>
          )}

          {/* Completed courses */}
          {completedCourses.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-headline text-foreground mb-4">Cursos Completados</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedCourses.map((e: any) => (
                  <CourseCard key={e.id} course={e.training_courses} enrollment={e} />
                ))}
              </div>
            </div>
          )}

          {/* Certificates */}
          {myCertificates.length > 0 && (
            <div>
              <h2 className="text-xl font-headline text-foreground mb-4">Mis Certificados</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myCertificates.map((cert: any) => (
                  <Card key={cert.id} className="border-primary/20">
                    <CardContent className="p-6 text-center">
                      <Award className="h-10 w-10 text-primary mx-auto mb-3" />
                      <h3 className="font-headline text-foreground mb-1">
                        {cert.training_courses?.title || cert.learning_tracks?.title || 'Certificado'}
                      </h3>
                      <Badge variant="outline" className="mb-2">{cert.certificate_type === 'track' ? 'Ruta' : 'Curso'}</Badge>
                      <p className="text-xs text-muted-foreground">#{cert.certificate_number}</p>
                      <p className="text-xs text-muted-foreground">{new Date(cert.issued_at).toLocaleDateString('es')}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {myEnrollments.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-headline text-foreground mb-2">Aún no tienes cursos</h3>
                <p className="text-muted-foreground mb-4">Explora nuestro catálogo y comienza tu formación profesional.</p>
                <Button onClick={() => navigate('/learn')}>Explorar Cursos</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default StudentDashboard;
