import { useState } from 'react';
import { Search, GraduationCap, BookOpen, Award, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TrackCard from '@/components/learn/TrackCard';
import CourseCard from '@/components/learn/CourseCard';
import restrolearnLogo from '@/assets/logos/restrolearn.png';
import SEOHead from '@/components/SEOHead';
import { useLearnData } from '@/hooks/useLearnData';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const categories = [
  { id: 'all', label: 'Todos' },
  { id: 'kitchen', label: '🍳 Cocina' },
  { id: 'service', label: '🍷 Servicio' },
  { id: 'management', label: '📊 Gestión' },
  { id: 'bartender', label: '🍸 Bartender' },
  { id: 'marketing', label: '📱 Marketing' },
  { id: 'finance', label: '💰 Finanzas' },
];

const LearnHome = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const { tracks, courses, myEnrollments, isLoading } = useLearnData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const filteredCourses = courses.filter((c: any) => {
    const matchSearch = !searchTerm || c.title.toLowerCase().includes(searchTerm.toLowerCase()) || (c.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = activeCategory === 'all' || c.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const enrollmentMap = new Map(myEnrollments.map((e: any) => [e.course_id, e]));
  const featuredTracks = tracks.filter((t: any) => t.is_featured);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="RestroLearn - Formación y Certificaciones para Restaurantes | RestroWizard"
        description="Cursos y rutas de aprendizaje diseñadas para cada rol de la industria gastronómica. Certificaciones profesionales, contenido generado con IA y formación continua."
        canonical="https://restrowizard.lovable.app/learn"
      />
      <Header />

      {/* Hero */}
      <section className="pt-28 pb-16 bg-gradient-to-br from-primary via-primary/90 to-primary/80 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.3),transparent_60%)]" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <img src={restrolearnLogo} alt="RestroLearn" className="h-16 md:h-20 w-auto mx-auto mb-6 brightness-0 invert" />
            <h1 className="text-3xl md:text-5xl font-headline text-primary-foreground mb-4">
              Enamórate de nuevo de la gastronomía
            </h1>
            <p className="text-xl text-primary-foreground/80 font-lato-regular mb-8">
              Crece con cada lección. Rutas de aprendizaje diseñadas para cada rol de la industria.
            </p>
            <div className="bg-card rounded-xl p-3 max-w-2xl mx-auto shadow-2xl">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar cursos, rutas de aprendizaje..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 border-0 bg-muted/50" />
                </div>
                <Button>Buscar</Button>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-6 mt-10 text-primary-foreground/80">
              <div className="text-center"><div className="text-2xl font-headline text-primary-foreground">{tracks.length}</div><div className="text-sm">Rutas</div></div>
              <div className="text-center"><div className="text-2xl font-headline text-primary-foreground">{courses.length}+</div><div className="text-sm">Cursos</div></div>
              <div className="text-center"><div className="text-2xl font-headline text-primary-foreground">{courses.reduce((s: number, c: any) => s + (c.enrollments_count || 0), 0).toLocaleString()}</div><div className="text-sm">Estudiantes</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* User quick access */}
      {user && myEnrollments.length > 0 && (
        <section className="py-8 bg-muted/30 border-b border-border">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-headline text-foreground">Continúa aprendiendo</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/learn/mi-progreso')}>Ver todo <ArrowRight className="h-4 w-4 ml-1" /></Button>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {myEnrollments.slice(0, 3).map((e: any) => (
                <CourseCard key={e.id} course={e.training_courses} enrollment={e} compact />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Learning Tracks */}
      {tracks.length > 0 && !searchTerm && activeCategory === 'all' && (
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="flex items-center gap-3 mb-8">
              <GraduationCap className="h-6 w-6 text-primary" />
              <h2 className="text-2xl md:text-3xl font-headline text-foreground">Rutas de Aprendizaje</h2>
            </div>
            <p className="text-muted-foreground mb-8 max-w-2xl">Sigue un camino estructurado para crecer en tu carrera gastronómica. Cada ruta combina cursos en orden lógico.</p>
            <div className="grid md:grid-cols-2 gap-4">
              {(featuredTracks.length > 0 ? featuredTracks : tracks).map((track: any) => (
                <TrackCard key={track.id} track={track} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category filters */}
      <section className="py-4 bg-card border-y border-border sticky top-16 z-30">
        <div className="container mx-auto px-6">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeCategory === cat.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Courses grid */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-headline text-foreground mb-8">
            {activeCategory === 'all' ? 'Todos los Cursos' : `Cursos de ${categories.find(c => c.id === activeCategory)?.label}`}
            <span className="text-sm font-normal text-muted-foreground ml-3">({filteredCourses.length})</span>
          </h2>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-12">Cargando cursos...</p>
          ) : filteredCourses.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No se encontraron cursos</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course: any) => (
                <CourseCard key={course.id} course={course} enrollment={enrollmentMap.get(course.id)} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* AI CTA */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="p-8 md:p-12 text-center">
              <Sparkles className="h-10 w-10 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-headline text-foreground mb-3">Genera Cursos con IA</h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">¿Eres restaurante o instructor? Crea cursos de formación completos con inteligencia artificial en minutos.</p>
              <Button size="lg" onClick={() => navigate('/r/settings')}>
                Crear Curso con IA <Sparkles className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-16">
        <div className="container mx-auto px-6 text-center">
          <Award className="h-8 w-8 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-headline text-foreground mb-3">Certificaciones Profesionales</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">Completa rutas de aprendizaje y obtén certificados verificables que validen tu experiencia.</p>
          {user ? (
            <Button variant="outline" onClick={() => navigate('/learn/mi-progreso')}>Ver Mis Certificados</Button>
          ) : (
            <Button onClick={() => navigate('/auth')}>Regístrate para Comenzar</Button>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-headline text-primary-foreground mb-4">¿Eres restaurante?</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">Capacita a tu equipo con RestroLearn desde RestroWizard. Contenido personalizado con IA para cada rol.</p>
          <Button size="lg" variant="secondary" onClick={() => navigate('/auth')}>
            Comenzar Ahora <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LearnHome;
