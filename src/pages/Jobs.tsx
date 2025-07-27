import { useState } from 'react';
import { Search, MapPin, Clock, Euro, Users, BookOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Mock data for demonstration
const mockJobs = [
  {
    id: '1',
    title: 'Chef de Cocina',
    restaurant_name: 'Restaurante El Dorado',
    location: 'Madrid, España',
    job_type: 'full_time',
    experience_level: 'senior',
    job_category: 'kitchen',
    salary_min: 2500,
    salary_max: 3500,
    applications_count: 12,
    created_at: '2024-01-15',
    description: 'Buscamos chef experimentado para liderar nuestra cocina mediterránea...',
    skills_required: ['Cocina mediterránea', 'Gestión de equipos', 'Control de costes']
  },
  {
    id: '2',
    title: 'Camarero/a',
    restaurant_name: 'Café Central',
    location: 'Barcelona, España',
    job_type: 'part_time',
    experience_level: 'entry',
    job_category: 'service',
    salary_min: 1200,
    salary_max: 1600,
    applications_count: 8,
    created_at: '2024-01-14',
    description: 'Oportunidad para empezar en el sector de la restauración...',
    skills_required: ['Atención al cliente', 'Trabajo en equipo', 'Idiomas']
  },
  {
    id: '3',
    title: 'Gerente de Restaurante',
    restaurant_name: 'Grupo Gastronómico Premium',
    location: 'Valencia, España',
    job_type: 'full_time',
    experience_level: 'lead',
    job_category: 'management',
    salary_min: 3500,
    salary_max: 4500,
    applications_count: 15,
    created_at: '2024-01-13',
    description: 'Únete a nuestro equipo directivo para gestionar operaciones...',
    skills_required: ['Gestión', 'Liderazgo', 'Análisis financiero']
  }
];

const mockCourses = [
  {
    id: '1',
    title: 'Técnicas Avanzadas de Cocina',
    instructor: 'Chef María González',
    duration_hours: 40,
    course_level: 'advanced',
    job_category: 'kitchen',
    price: 299,
    rating: 4.8,
    total_enrollments: 124,
    description: 'Aprende las técnicas más modernas de la alta cocina...',
    skills_covered: ['Sous vide', 'Fermentación', 'Emplatado creativo']
  },
  {
    id: '2',
    title: 'Gestión y Liderazgo en Restauración',
    instructor: 'Roberto Martínez',
    duration_hours: 24,
    course_level: 'intermediate',
    job_category: 'management',
    price: 199,
    rating: 4.6,
    total_enrollments: 89,
    description: 'Desarrolla habilidades de gestión para el sector gastronómico...',
    skills_covered: ['Liderazgo', 'Control de costes', 'Gestión de personal']
  },
  {
    id: '3',
    title: 'Protocolo y Servicio de Excelencia',
    instructor: 'Ana Rodríguez',
    duration_hours: 16,
    course_level: 'beginner',
    job_category: 'service',
    price: 149,
    rating: 4.9,
    total_enrollments: 156,
    description: 'Fundamentos del servicio profesional en restauración...',
    skills_covered: ['Protocolo', 'Comunicación', 'Servicio al cliente']
  }
];

const Jobs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const formatJobType = (type: string) => {
    const types: Record<string, string> = {
      full_time: 'Tiempo completo',
      part_time: 'Tiempo parcial',
      contract: 'Contrato',
      internship: 'Prácticas',
      freelance: 'Freelance'
    };
    return types[type] || type;
  };

  const formatCategory = (category: string) => {
    const categories: Record<string, string> = {
      kitchen: 'Cocina',
      service: 'Servicio',
      management: 'Gestión',
      administration: 'Administración',
      marketing: 'Marketing',
      finance: 'Finanzas',
      maintenance: 'Mantenimiento'
    };
    return categories[category] || category;
  };

  const formatLevel = (level: string) => {
    const levels: Record<string, string> = {
      entry: 'Inicial',
      junior: 'Junior',
      mid: 'Intermedio',
      senior: 'Senior',
      lead: 'Líder'
    };
    return levels[level] || level;
  };

  const formatCourseLevel = (level: string) => {
    const levels: Record<string, string> = {
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
      expert: 'Experto'
    };
    return levels[level] || level;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary-foreground text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Restro Jobs
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Encuentra tu próxima oportunidad en la industria gastronómica
            </p>
            
            {/* Search Bar */}
            <div className="bg-background rounded-lg p-4 max-w-3xl mx-auto">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar empleos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Ubicación..."
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    <SelectItem value="kitchen">Cocina</SelectItem>
                    <SelectItem value="service">Servicio</SelectItem>
                    <SelectItem value="management">Gestión</SelectItem>
                    <SelectItem value="administration">Administración</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Buscar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="jobs" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
              <TabsTrigger value="jobs" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Empleos
              </TabsTrigger>
              <TabsTrigger value="training" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Formación
              </TabsTrigger>
            </TabsList>

            <TabsContent value="jobs">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Ofertas de Empleo</h2>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Publicar Empleo
                </Button>
              </div>

              <div className="grid gap-6">
                {mockJobs.map((job) => (
                  <Card key={job.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                          <CardDescription className="text-base text-foreground font-medium">
                            {job.restaurant_name}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-primary">
                            €{job.salary_min} - €{job.salary_max}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {job.applications_count} candidatos
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-4">
                        <Badge variant="secondary">
                          <MapPin className="h-3 w-3 mr-1" />
                          {job.location}
                        </Badge>
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatJobType(job.job_type)}
                        </Badge>
                        <Badge variant="outline">
                          {formatCategory(job.job_category)}
                        </Badge>
                        <Badge variant="outline">
                          {formatLevel(job.experience_level)}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-muted-foreground mb-4 line-clamp-2">
                        {job.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-1 mb-4">
                        {job.skills_required.slice(0, 3).map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {job.skills_required.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{job.skills_required.length - 3} más
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Publicado hace 2 días
                        </span>
                        <Button>Ver Detalles</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="training">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Cursos de Formación</h2>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Crear Curso
                </Button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockCourses.map((course) => (
                  <Card key={course.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                      <CardDescription>por {course.instructor}</CardDescription>
                      
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="text-sm font-medium">{course.rating}</span>
                          <span className="text-sm text-muted-foreground">
                            ({course.total_enrollments})
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-primary">
                            €{course.price}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          {course.duration_hours}h
                        </Badge>
                        <Badge variant="outline">
                          {formatCourseLevel(course.course_level)}
                        </Badge>
                        <Badge variant="outline">
                          {formatCategory(course.job_category)}
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground mb-4 line-clamp-2">
                        {course.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-1 mb-4">
                        {course.skills_covered.slice(0, 3).map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      
                      <Button className="w-full">Inscribirse</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground">Ofertas Activas</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">1,200+</div>
              <div className="text-sm text-muted-foreground">Restaurantes</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">5,000+</div>
              <div className="text-sm text-muted-foreground">Profesionales</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">50+</div>
              <div className="text-sm text-muted-foreground">Cursos</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Jobs;