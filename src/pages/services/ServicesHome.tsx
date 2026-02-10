import { useState } from 'react';
import { Search, MapPin, Filter, ArrowRight, Building2, Wrench, Cpu, Leaf, PenTool, MessageSquare, TrendingUp, Users, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProviderCard from '@/components/services/ProviderCard';
import RequestCard from '@/components/services/RequestCard';
import ServiceRequestForm from '@/components/services/ServiceRequestForm';
import restroservicesLogo from '@/assets/logos/restroservices.png';
import { useProviders, useServiceRequests } from '@/hooks/useServiceMarketplace';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const serviceCategories = [
  { id: 'all', label: 'Todos', icon: Filter },
  { id: 'equipment', label: 'Equipamiento', icon: Wrench },
  { id: 'technology', label: 'Tecnología', icon: Cpu },
  { id: 'food_supplies', label: 'Ingredientes', icon: Leaf },
  { id: 'consulting', label: 'Consultoría', icon: Building2 },
  { id: 'design', label: 'Diseño', icon: PenTool },
];

const ServicesHome = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const { session } = useAuth();
  const navigate = useNavigate();

  const { data: providers = [] } = useProviders({ category: activeCategory, city: cityFilter, search: searchTerm });
  const { data: openRequests = [] } = useServiceRequests({ status: 'open' });

  const cities = [...new Set(providers.map((p: any) => p.city).filter(Boolean))];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-28 pb-16 bg-gradient-to-br from-purple-intense via-purple-medium to-purple-intense relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(212,165,219,0.2),transparent_60%)]" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <img src={restroservicesLogo} alt="RestroServices" className="h-16 md:h-20 w-auto mx-auto mb-6 brightness-0 invert" />
            <p className="text-xl md:text-2xl text-white/90 font-lato-regular mb-4">
              El marketplace donde tu restaurante encuentra todo lo que necesita
            </p>
            <p className="text-white/70 mb-8 max-w-2xl mx-auto">
              Proveedores verificados, cotizaciones comparables y contrataciones seguras para la industria gastronómica
            </p>

            <div className="bg-white rounded-xl p-3 max-w-3xl mx-auto shadow-2xl">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar proveedores, servicios..." value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)} className="pl-10 border-0 bg-muted/50" />
                </div>
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="w-full md:w-48 border-0 bg-muted/50">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las ciudades</SelectItem>
                    {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button className="bg-gradient-to-r from-purple-medium to-purple-intense text-white font-lato-bold">Buscar</Button>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-8 mt-10 text-white/80">
              <div className="text-center"><div className="text-2xl font-headline text-white">{providers.length}+</div><div className="text-sm font-lato-light">Proveedores</div></div>
              <div className="text-center"><div className="text-2xl font-headline text-white">{openRequests.length}</div><div className="text-sm font-lato-light">Solicitudes Abiertas</div></div>
              <div className="text-center"><div className="text-2xl font-headline text-white">{cities.length}</div><div className="text-sm font-lato-light">Ciudades</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-4 bg-card border-b sticky top-16 z-30">
        <div className="container mx-auto px-6">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {serviceCategories.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}>
                <cat.icon className="h-4 w-4" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content with Tabs */}
      <section className="py-8">
        <div className="container mx-auto px-6">
          <Tabs defaultValue="providers" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="providers" className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Proveedores
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Solicitudes Abiertas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="providers">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-headline text-foreground">
                    {activeCategory === 'all' ? 'Todos los Proveedores' : serviceCategories.find(c => c.id === activeCategory)?.label}
                  </h2>
                  <p className="text-muted-foreground text-sm">{providers.length} proveedores encontrados</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {providers.map((provider: any) => (
                  <ProviderCard key={provider.id} provider={provider} />
                ))}
              </div>

              {providers.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No se encontraron proveedores con estos filtros</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="requests">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-headline text-foreground">Solicitudes Abiertas</h2>
                  <p className="text-muted-foreground text-sm">Restaurantes buscando proveedores — ¡envía tu propuesta!</p>
                </div>
                {session && (
                  <Button onClick={() => setRequestFormOpen(true)}>
                    <MessageSquare className="h-4 w-4 mr-2" /> Publicar Necesidad
                  </Button>
                )}
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {openRequests.map((request: any) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>

              {openRequests.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No hay solicitudes abiertas por el momento</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTAs */}
      <section className="py-16 bg-gradient-to-r from-purple-intense to-purple-medium">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="bg-white/10 border-white/20 text-white backdrop-blur-sm">
              <CardContent className="pt-8 text-center">
                <Building2 className="h-10 w-10 mx-auto mb-4 text-lavender-light" />
                <h3 className="text-xl font-headline mb-3">¿Eres proveedor?</h3>
                <p className="text-white/80 text-sm mb-6">Registra tu empresa y conecta con miles de restaurantes.</p>
                <Button className="bg-white text-purple-intense hover:bg-off-white font-lato-bold"
                  onClick={() => navigate(session ? '/services/register' : '/auth')}>
                  Publicar Servicio <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20 text-white backdrop-blur-sm">
              <CardContent className="pt-8 text-center">
                <TrendingUp className="h-10 w-10 mx-auto mb-4 text-lavender-light" />
                <h3 className="text-xl font-headline mb-3">¿Necesitas un servicio?</h3>
                <p className="text-white/80 text-sm mb-6">Publica tu necesidad y recibe propuestas de múltiples proveedores.</p>
                <Button className="bg-white text-purple-intense hover:bg-off-white font-lato-bold"
                  onClick={() => session ? setRequestFormOpen(true) : navigate('/auth')}>
                  Publicar Necesidad <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
      <ServiceRequestForm open={requestFormOpen} onOpenChange={setRequestFormOpen} />
    </div>
  );
};

export default ServicesHome;
