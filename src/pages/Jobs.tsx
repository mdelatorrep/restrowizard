import { useState, useEffect } from 'react';
import { Search, MapPin, Clock, Users, Loader2, Briefcase, User, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useJobs, Job, JobFilters } from '@/hooks/useJobs';
import { useSavedJobs } from '@/hooks/useSavedJobs';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import JobCard from '@/components/jobs/JobCard';
import restrojobsLogo from '@/assets/logos/restrojobs.png';

const categoryOptions = [
  { value: 'all', label: 'Todas' },
  { value: 'kitchen', label: 'Cocina' },
  { value: 'service', label: 'Servicio' },
  { value: 'management', label: 'Gestión' },
  { value: 'bartender', label: 'Bartender' },
  { value: 'cleaning', label: 'Limpieza' },
  { value: 'delivery', label: 'Domicilios' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'finance', label: 'Finanzas' },
  { value: 'administration', label: 'Administración' },
];

const jobTypeOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'full_time', label: 'Tiempo completo' },
  { value: 'part_time', label: 'Medio tiempo' },
  { value: 'contract', label: 'Contrato' },
  { value: 'temporary', label: 'Temporal' },
  { value: 'internship', label: 'Pasantía' },
];

const levelOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'entry', label: 'Entrada' },
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Intermedio' },
  { value: 'senior', label: 'Senior' },
  { value: 'executive', label: 'Ejecutivo' },
];

const Jobs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [jobTypeFilter, setJobTypeFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const { loading, getJobs } = useJobs();
  const { user } = useAuth();
  const { isJobSaved, toggleSave } = useSavedJobs();
  const navigate = useNavigate();

  useEffect(() => { loadJobs(); }, []);

  const loadJobs = async (filters?: JobFilters) => {
    const data = await getJobs(filters);
    setJobs(data);
  };

  const handleSearch = () => {
    const filters: JobFilters = {};
    if (searchTerm) filters.search = searchTerm;
    if (locationFilter) filters.location = locationFilter;
    if (categoryFilter !== 'all') filters.category = categoryFilter;
    if (jobTypeFilter !== 'all') filters.job_type = jobTypeFilter;
    if (levelFilter !== 'all') filters.experience_level = levelFilter;
    loadJobs(filters);
  };

  const urgentJobs = jobs.filter(j => j.urgent);
  const regularJobs = jobs.filter(j => !j.urgent);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-28 pb-12 bg-gradient-to-br from-primary via-secondary to-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,rgba(212,165,219,0.15),transparent_60%)]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <img src={restrojobsLogo} alt="RestroJobs" className="h-14 md:h-18 w-auto mx-auto mb-4 brightness-0 invert" />
            <p className="text-lg md:text-xl mb-6 text-primary-foreground/90">
              La bolsa de empleo especializada en gastronomía. Encuentra tu próximo rol o el talento ideal.
            </p>

            {/* Search */}
            <div className="bg-card rounded-xl p-4 max-w-3xl mx-auto shadow-2xl">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Cargo, habilidad o restaurante..." value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10" onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
                </div>
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Ciudad o ubicación..." value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="pl-10" onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
                </div>
                <Button size="lg" onClick={handleSearch} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
                </Button>
              </div>

              {/* Filters toggle */}
              <div className="mt-3 flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)} className="text-xs gap-1">
                  <Filter className="h-3 w-3" /> {showFilters ? 'Ocultar filtros' : 'Más filtros'}
                </Button>
                {user && (
                  <Button variant="ghost" size="sm" onClick={() => navigate('/jobs/mi-perfil')} className="text-xs gap-1">
                    <User className="h-3 w-3" /> Mi panel
                  </Button>
                )}
              </div>

              {showFilters && (
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); }}>
                    <SelectTrigger className="text-sm"><SelectValue placeholder="Categoría" /></SelectTrigger>
                    <SelectContent>{categoryOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={jobTypeFilter} onValueChange={(v) => { setJobTypeFilter(v); }}>
                    <SelectTrigger className="text-sm"><SelectValue placeholder="Tipo" /></SelectTrigger>
                    <SelectContent>{jobTypeOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={levelFilter} onValueChange={(v) => { setLevelFilter(v); }}>
                    <SelectTrigger className="text-sm"><SelectValue placeholder="Nivel" /></SelectTrigger>
                    <SelectContent>{levelOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Main */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-muted-foreground">{jobs.length} ofertas encontradas</p>
                <Button variant="outline" size="sm" onClick={() => navigate(user ? '/r/settings' : '/auth')}>
                  Publicar empleo
                </Button>
              </div>

              {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : jobs.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <Briefcase className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No hay ofertas</h3>
                    <p className="text-muted-foreground">Prueba cambiando los filtros de búsqueda</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Urgent jobs first */}
                  {urgentJobs.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-destructive flex items-center gap-1">🔥 Contratación urgente</h3>
                      {urgentJobs.map((job) => (
                        <JobCard key={job.id} job={job} isSaved={isJobSaved(job.id)}
                          onToggleSave={() => user ? toggleSave.mutate(job.id) : navigate('/auth')} />
                      ))}
                    </div>
                  )}

                  {/* Regular jobs */}
                  {regularJobs.map((job) => (
                    <JobCard key={job.id} job={job} isSaved={isJobSaved(job.id)}
                      onToggleSave={() => user ? toggleSave.mutate(job.id) : navigate('/auth')} />
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-sm">Estadísticas</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Ofertas activas</span><span className="font-semibold">{jobs.length}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Urgentes</span><span className="font-semibold text-destructive">{urgentJobs.length}</span></div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-sm">Categorías populares</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {categoryOptions.filter(c => c.value !== 'all').slice(0, 6).map(c => (
                      <Badge key={c.value} variant="outline" className="cursor-pointer text-xs"
                        onClick={() => { setCategoryFilter(c.value); handleSearch(); }}>
                        {c.label}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary/5 border-primary/10">
                <CardContent className="p-4 text-center space-y-2">
                  <p className="text-sm font-medium">¿Eres restaurante?</p>
                  <p className="text-xs text-muted-foreground">
                    Solo restaurantes registrados en RestroWizard pueden publicar ofertas.
                  </p>
                  <Button size="sm" variant="outline" onClick={() => navigate(user ? '/r/settings' : '/auth')}>
                    Publicar empleo
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Jobs;
