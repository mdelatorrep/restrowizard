import { useState, useEffect } from 'react';
import { Plus, Edit, Eye, Trash2, Users, MapPin, Clock, Euro } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useJobs, Job } from '@/hooks/useJobs';
import { useAuth } from '@/hooks/useAuth';

const JobsManagement = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { getMyJobs, createJob, updateJob, deleteJob } = useJobs();
  const { user } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    responsibilities: '',
    job_type: 'full_time' as const,
    job_category: 'kitchen' as const,
    experience_level: 'mid' as const,
    location: '',
    salary_min: '',
    salary_max: '',
    restaurant_name: '',
    benefits: [] as string[],
    skills_required: [] as string[],
    application_deadline: '',
    start_date: ''
  });

  useEffect(() => {
    if (user?.id) {
      loadMyJobs();
    }
  }, [user]);

  const loadMyJobs = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    const myJobs = await getMyJobs(user.id);
    setJobs(myJobs);
    setIsLoading(false);
  };

  const handleCreateJob = async () => {
    if (!user?.id) return;

    const jobData = {
      ...formData,
      employer_id: user.id,
      salary_min: formData.salary_min ? parseFloat(formData.salary_min) : undefined,
      salary_max: formData.salary_max ? parseFloat(formData.salary_max) : undefined,
      currency: 'EUR',
      is_active: true,
      is_featured: false
    };

    const newJob = await createJob(jobData);
    if (newJob) {
      setJobs([newJob, ...jobs]);
      setIsCreateModalOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      requirements: '',
      responsibilities: '',
      job_type: 'full_time',
      job_category: 'kitchen',
      experience_level: 'mid',
      location: '',
      salary_min: '',
      salary_max: '',
      restaurant_name: '',
      benefits: [],
      skills_required: [],
      application_deadline: '',
      start_date: ''
    });
  };

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Empleos</h2>
          <p className="text-muted-foreground">Administra las ofertas de trabajo de tu restaurante</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Publicar Empleo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Publicar Nueva Oferta de Empleo</DialogTitle>
              <DialogDescription>
                Completa la información para publicar una nueva oferta en Restro Jobs
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título del Puesto *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Ej: Chef de Cocina"
                  />
                </div>
                <div>
                  <Label htmlFor="restaurant_name">Nombre del Restaurante *</Label>
                  <Input
                    id="restaurant_name"
                    value={formData.restaurant_name}
                    onChange={(e) => setFormData({...formData, restaurant_name: e.target.value})}
                    placeholder="Nombre de tu restaurante"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descripción del Puesto *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe el puesto de trabajo..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="job_type">Tipo de Empleo</Label>
                  <Select value={formData.job_type} onValueChange={(value: any) => setFormData({...formData, job_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">Tiempo completo</SelectItem>
                      <SelectItem value="part_time">Tiempo parcial</SelectItem>
                      <SelectItem value="contract">Contrato</SelectItem>
                      <SelectItem value="internship">Prácticas</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="job_category">Categoría</Label>
                  <Select value={formData.job_category} onValueChange={(value: any) => setFormData({...formData, job_category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kitchen">Cocina</SelectItem>
                      <SelectItem value="service">Servicio</SelectItem>
                      <SelectItem value="management">Gestión</SelectItem>
                      <SelectItem value="administration">Administración</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="finance">Finanzas</SelectItem>
                      <SelectItem value="maintenance">Mantenimiento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="experience_level">Nivel de Experiencia</Label>
                  <Select value={formData.experience_level} onValueChange={(value: any) => setFormData({...formData, experience_level: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Inicial</SelectItem>
                      <SelectItem value="junior">Junior</SelectItem>
                      <SelectItem value="mid">Intermedio</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                      <SelectItem value="lead">Líder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="location">Ubicación *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Ej: Madrid, España"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="salary_min">Salario Mínimo (€)</Label>
                  <Input
                    id="salary_min"
                    type="number"
                    value={formData.salary_min}
                    onChange={(e) => setFormData({...formData, salary_min: e.target.value})}
                    placeholder="2000"
                  />
                </div>
                <div>
                  <Label htmlFor="salary_max">Salario Máximo (€)</Label>
                  <Input
                    id="salary_max"
                    type="number"
                    value={formData.salary_max}
                    onChange={(e) => setFormData({...formData, salary_max: e.target.value})}
                    placeholder="3000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="requirements">Requisitos</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                  placeholder="Lista los requisitos necesarios para el puesto..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="responsibilities">Responsabilidades</Label>
                <Textarea
                  id="responsibilities"
                  value={formData.responsibilities}
                  onChange={(e) => setFormData({...formData, responsibilities: e.target.value})}
                  placeholder="Describe las principales responsabilidades..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateJob}>
                Publicar Empleo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Empleos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empleos Activos</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs.filter(job => job.is_active).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Candidatos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jobs.reduce((total, job) => total + job.applications_count, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visualizaciones</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jobs.reduce((total, job) => total + job.views_count, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Cargando empleos...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No tienes empleos publicados aún.</p>
            <p className="text-sm text-muted-foreground">¡Publica tu primera oferta de trabajo!</p>
          </div>
        ) : (
          jobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {job.title}
                      {!job.is_active && (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                      {job.is_featured && (
                        <Badge variant="default">Destacado</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{job.restaurant_name}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
                  {job.salary_min && job.salary_max && (
                    <Badge variant="outline">
                      <Euro className="h-3 w-3 mr-1" />
                      {job.salary_min} - {job.salary_max}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-muted-foreground mb-4 line-clamp-2">
                  {job.description}
                </p>
                
                <div className="flex justify-between items-center text-sm">
                  <div className="flex gap-4">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {job.applications_count} candidatos
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {job.views_count} visualizaciones
                    </span>
                  </div>
                  <span className="text-muted-foreground">
                    Publicado {new Date(job.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default JobsManagement;