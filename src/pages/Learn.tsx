import { useState } from 'react';
import { Search, Clock, Users, Star, BookOpen, Award, GraduationCap, ChefHat, Utensils, BarChart3, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import restrolearnLogo from '@/assets/logos/restrolearn.png';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const categories = [
  { id: 'all', label: 'Todos', icon: BookOpen },
  { id: 'kitchen', label: 'Cocina', icon: ChefHat },
  { id: 'service', label: 'Servicio', icon: Utensils },
  { id: 'management', label: 'Gestión', icon: BarChart3 },
  { id: 'marketing', label: 'Marketing', icon: Megaphone },
];

const certifications = [
  { name: 'Certificación en Gestión Gastronómica', hours: 120, modules: 8, icon: '🏆' },
  { name: 'Diploma en Alta Cocina', hours: 200, modules: 12, icon: '👨‍🍳' },
  { name: 'Especialista en Servicio Premium', hours: 80, modules: 6, icon: '⭐' },
  { name: 'Marketing Gastronómico Digital', hours: 60, modules: 5, icon: '📲' },
];

const levelLabels: Record<string, string> = {
  entry: 'Principiante', junior: 'Junior', mid: 'Intermedio', senior: 'Avanzado', lead: 'Experto',
};

const categoryEmojis: Record<string, string> = {
  kitchen: '🍳', service: '🍷', management: '📊', marketing: '📱', other: '📚',
};

const Learn = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const { data: courses = [] } = useQuery({
    queryKey: ['training-courses-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_courses')
        .select('*')
        .eq('is_published', true)
        .order('enrollments_count', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredCourses = courses.filter((c: any) => {
    const matchSearch = !searchTerm || c.title.toLowerCase().includes(searchTerm.toLowerCase()) || (c.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = activeCategory === 'all' || c.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const featuredCourses = courses.filter((c: any) => c.enrollments_count >= 500).slice(0, 3);

  return (
    <div className="min-h-screen bg-off-white">
      <Header />

      {/* Hero */}
      <section className="pt-28 pb-16 bg-gradient-to-br from-purple-intense via-purple-medium to-purple-intense relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(212,165,219,0.2),transparent_60%)]" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <img src={restrolearnLogo} alt="RestroLearn" className="h-16 md:h-20 w-auto mx-auto mb-6 brightness-0 invert" />
            <p className="text-xl md:text-2xl text-white/90 font-lato-regular mb-8">
              Formación y capacitación continua para profesionales de la industria gastronómica
            </p>

            <div className="bg-white rounded-xl p-3 max-w-2xl mx-auto shadow-2xl">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-dark-gray/50" />
                  <Input placeholder="Buscar cursos, instructores..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 border-0 bg-off-white/50" />
                </div>
                <Button className="bg-gradient-to-r from-purple-medium to-purple-intense text-white font-lato-bold">Buscar</Button>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-6 mt-10 text-white/80">
              <div className="text-center"><div className="text-2xl font-headline text-white">{courses.length}+</div><div className="text-sm font-lato-light">Cursos</div></div>
              <div className="text-center"><div className="text-2xl font-headline text-white">{courses.reduce((s: number, c: any) => s + (c.enrollments_count || 0), 0).toLocaleString()}+</div><div className="text-sm font-lato-light">Estudiantes</div></div>
              <div className="text-center"><div className="text-2xl font-headline text-white">50+</div><div className="text-sm font-lato-light">Instructores</div></div>
              <div className="text-center"><div className="text-2xl font-headline text-white">4</div><div className="text-sm font-lato-light">Certificaciones</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-4 bg-white border-b border-lavender-light/30 sticky top-16 z-30">
        <div className="container mx-auto px-6">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-lato-medium whitespace-nowrap transition-all ${activeCategory === cat.id ? 'bg-purple-intense text-white' : 'bg-lavender-light/30 text-purple-intense hover:bg-lavender-light/60'}`}>
                <cat.icon className="h-4 w-4" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      {activeCategory === 'all' && !searchTerm && featuredCourses.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="flex items-center gap-3 mb-8">
              <Star className="h-6 w-6 text-purple-medium" />
              <h2 className="text-2xl md:text-3xl font-headline text-purple-intense">Cursos Destacados</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {featuredCourses.map((course: any) => (
                <Card key={course.id} className="border-2 border-purple-medium/20 hover:border-purple-medium/50 hover:shadow-xl transition-all cursor-pointer group">
                  <CardHeader>
                    <div className="text-4xl mb-3">{categoryEmojis[course.category] || '📚'}</div>
                    <Badge className="w-fit bg-lavender-light/50 text-purple-intense border-0 mb-2">{levelLabels[course.level] || course.level}</Badge>
                    <CardTitle className="text-lg group-hover:text-purple-medium transition-colors">{course.title}</CardTitle>
                    <p className="text-sm text-dark-gray font-lato-regular">{course.short_description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-dark-gray mb-3">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.duration_hours}h</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{(course.enrollments_count || 0).toLocaleString()}</span>
                      <span className="flex items-center gap-1 text-yellow-500">★ {course.average_rating}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-headline text-purple-intense">{course.is_free ? 'Gratis' : `€${course.price}`}</span>
                      <Button size="sm" className="bg-gradient-to-r from-purple-medium to-purple-intense text-white">Inscribirse</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Courses */}
      <section className="py-12 bg-lavender-light/10">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-headline text-purple-intense mb-8">
            {activeCategory === 'all' ? 'Todos los Cursos' : `Cursos de ${categories.find(c => c.id === activeCategory)?.label}`}
            <span className="text-sm font-lato-regular text-dark-gray ml-3">({filteredCourses.length} cursos)</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course: any) => (
              <Card key={course.id} className="bg-white hover:shadow-lg transition-all cursor-pointer border border-lavender-light/30">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <span className="text-3xl">{categoryEmojis[course.category] || '📚'}</span>
                    <Badge className="bg-lavender-light/50 text-purple-intense border-0 text-xs">{levelLabels[course.level] || course.level}</Badge>
                  </div>
                  <CardTitle className="text-base mt-2">{course.title}</CardTitle>
                  <p className="text-xs text-dark-gray font-lato-regular">{course.short_description}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 text-xs text-dark-gray mb-3">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.duration_hours}h</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{(course.enrollments_count || 0).toLocaleString()}</span>
                    <span className="text-yellow-500">★ {course.average_rating}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-lavender-light/30">
                    <span className="text-lg font-headline text-purple-intense">{course.is_free ? 'Gratis' : `€${course.price}`}</span>
                    <Button size="sm" variant="outline" className="border-purple-medium text-purple-medium hover:bg-purple-medium hover:text-white text-xs">Ver Curso</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-purple-medium/10 rounded-full px-4 py-2 mb-4">
              <Award className="h-4 w-4 text-purple-medium" />
              <span className="text-sm font-lato-medium text-purple-medium">Programas de Certificación</span>
            </div>
            <h2 className="text-3xl font-headline text-purple-intense mb-3">Certifica tu Experiencia</h2>
            <p className="text-dark-gray font-lato-regular max-w-2xl mx-auto">Programas completos diseñados con expertos de la industria para validar y potenciar tus habilidades profesionales.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {certifications.map(cert => (
              <Card key={cert.name} className="text-center hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-medium/30 cursor-pointer">
                <CardContent className="pt-8 pb-6">
                  <div className="text-4xl mb-4">{cert.icon}</div>
                  <h3 className="font-headline text-purple-intense mb-3 text-sm">{cert.name}</h3>
                  <div className="flex justify-center gap-4 text-xs text-dark-gray mb-4">
                    <span>{cert.hours}h</span>
                    <span>{cert.modules} módulos</span>
                  </div>
                  <Button size="sm" className="bg-gradient-to-r from-purple-medium to-purple-intense text-white w-full">Más Info</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-purple-intense to-purple-medium">
        <div className="container mx-auto px-6 text-center">
          <GraduationCap className="h-12 w-12 text-white/80 mx-auto mb-4" />
          <h2 className="text-3xl font-headline text-white mb-4">¿Eres instructor o experto gastronómico?</h2>
          <p className="text-white/80 font-lato-regular mb-8 max-w-xl mx-auto">Comparte tu conocimiento con miles de profesionales. Publica tus cursos en RestroLearn.</p>
          <Button size="lg" className="bg-white text-purple-intense hover:bg-off-white font-lato-bold">Publicar un Curso</Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Learn;
