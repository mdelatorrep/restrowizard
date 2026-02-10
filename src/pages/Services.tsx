import { useState } from 'react';
import { Search, MapPin, Star, Filter, ArrowRight, Building2, Cpu, Leaf, PenTool, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import restroservicesLogo from '@/assets/logos/restroservices.png';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const serviceCategories = [
  { id: 'all', label: 'Todos', icon: Filter },
  { id: 'equipment', label: 'Equipamiento', icon: Wrench },
  { id: 'technology', label: 'Tecnología', icon: Cpu },
  { id: 'food_supplies', label: 'Ingredientes', icon: Leaf },
  { id: 'consulting', label: 'Consultoría', icon: Building2 },
  { id: 'design', label: 'Diseño', icon: PenTool },
];

const Services = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');

  const { data: providers = [] } = useQuery({
    queryKey: ['service-providers-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .eq('is_active', true)
        .order('average_rating', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const cities = [...new Set(providers.map((p: any) => p.city))];

  const filtered = providers.filter((p: any) => {
    const matchSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.specialty || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchCity = cityFilter === 'all' || p.city === cityFilter;
    return matchSearch && matchCategory && matchCity;
  });

  return (
    <div className="min-h-screen bg-off-white">
      <Header />

      {/* Hero */}
      <section className="pt-28 pb-16 bg-gradient-to-br from-purple-intense via-purple-medium to-purple-intense relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(212,165,219,0.2),transparent_60%)]" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <img src={restroservicesLogo} alt="RestroServices" className="h-16 md:h-20 w-auto mx-auto mb-6 brightness-0 invert" />
            <p className="text-xl md:text-2xl text-white/90 font-lato-regular mb-8">
              Directorio de proveedores y servicios especializados para la industria restaurantera
            </p>

            <div className="bg-white rounded-xl p-3 max-w-3xl mx-auto shadow-2xl">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-dark-gray/50" />
                  <Input placeholder="Buscar proveedores, servicios..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 border-0 bg-off-white/50" />
                </div>
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="w-full md:w-48 border-0 bg-off-white/50">
                    <MapPin className="h-4 w-4 mr-2 text-dark-gray/50" />
                    <SelectValue placeholder="Ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las ciudades</SelectItem>
                    {cities.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button className="bg-gradient-to-r from-purple-medium to-purple-intense text-white font-lato-bold">Buscar</Button>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-6 mt-10 text-white/80">
              <div className="text-center"><div className="text-2xl font-headline text-white">{providers.length}+</div><div className="text-sm font-lato-light">Proveedores</div></div>
              <div className="text-center"><div className="text-2xl font-headline text-white">{cities.length}</div><div className="text-sm font-lato-light">Ciudades</div></div>
              <div className="text-center"><div className="text-2xl font-headline text-white">5</div><div className="text-sm font-lato-light">Categorías</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-4 bg-white border-b border-lavender-light/30 sticky top-16 z-30">
        <div className="container mx-auto px-6">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {serviceCategories.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-lato-medium whitespace-nowrap transition-all ${activeCategory === cat.id ? 'bg-purple-intense text-white' : 'bg-lavender-light/30 text-purple-intense hover:bg-lavender-light/60'}`}>
                <cat.icon className="h-4 w-4" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Providers */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-headline text-purple-intense mb-2">
            {activeCategory === 'all' ? 'Todos los Proveedores' : `${serviceCategories.find(c => c.id === activeCategory)?.label}`}
          </h2>
          <p className="text-dark-gray font-lato-regular mb-8">{filtered.length} proveedores encontrados</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((provider: any) => (
              <Card key={provider.id} className="bg-white hover:shadow-xl transition-all cursor-pointer border border-lavender-light/30 group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg group-hover:text-purple-medium transition-colors flex items-center gap-2">
                        {provider.name}
                        {provider.is_verified && <Badge className="bg-green-100 text-green-700 border-0 text-[10px]">✓ Verificado</Badge>}
                      </CardTitle>
                      <p className="text-sm text-purple-medium font-lato-medium mt-1">{provider.specialty}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-dark-gray font-lato-regular mb-3 line-clamp-2">{provider.description}</p>

                  <div className="flex items-center gap-3 text-sm text-dark-gray mb-3">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{provider.city}</span>
                    <span className="flex items-center gap-1 text-yellow-500"><Star className="h-3 w-3 fill-current" />{provider.average_rating || provider.rating}</span>
                    <span className="text-xs">({provider.reviews_count} reseñas)</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {(provider.tags || []).map((tag: string) => <Badge key={tag} variant="outline" className="text-xs border-lavender-light text-purple-intense">{tag}</Badge>)}
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 bg-gradient-to-r from-purple-medium to-purple-intense text-white text-xs">Contactar</Button>
                    <Button size="sm" variant="outline" className="border-purple-medium text-purple-medium hover:bg-purple-medium hover:text-white text-xs">Cotizar</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
                <p className="text-white/80 font-lato-regular text-sm mb-6">Registra tu empresa y conecta con miles de restaurantes.</p>
                <Button className="bg-white text-purple-intense hover:bg-off-white font-lato-bold">
                  Publicar Servicio <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20 text-white backdrop-blur-sm">
              <CardContent className="pt-8 text-center">
                <Wrench className="h-10 w-10 mx-auto mb-4 text-lavender-light" />
                <h3 className="text-xl font-headline mb-3">¿Necesitas cotizaciones?</h3>
                <p className="text-white/80 font-lato-regular text-sm mb-6">Publica tu necesidad y recibe propuestas de múltiples proveedores.</p>
                <Button className="bg-white text-purple-intense hover:bg-off-white font-lato-bold">
                  Solicitar Cotización <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Services;
