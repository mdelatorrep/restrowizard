import { useState } from 'react';
import { Rocket, TrendingUp, Users, Lightbulb, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import restrogrowthLogo from '@/assets/logos/restrogrowth.png';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const pillars = [
  { icon: TrendingUp, title: 'Inversionistas', description: 'Conecta con oportunidades de inversión en conceptos gastronómicos validados con datos reales de mercado.', features: ['Deal flow curado', 'Due diligence asistida por IA', 'Reportes de rendimiento'] },
  { icon: Users, title: 'Restauranteros', description: 'Encuentra el capital y los socios estratégicos para expandir tu marca o abrir nuevas ubicaciones.', features: ['Pitch deck builder', 'Valoración de negocio', 'Matchmaking inteligente'] },
  { icon: Lightbulb, title: 'Nuevos Conceptos', description: 'Valida tu idea de negocio gastronómico con herramientas de análisis de mercado y viabilidad.', features: ['Análisis de viabilidad', 'Estudio de mercado', 'Plan de negocio IA'] },
];

const Growth = () => {
  const [email, setEmail] = useState('');
  const [interestType, setInterestType] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !interestType) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('growth_preregistrations').insert({ email, interest_type: interestType });
      if (error) {
        if (error.code === '23505') {
          toast.error('Este correo ya está pre-registrado');
        } else {
          throw error;
        }
      } else {
        setSubmitted(true);
        toast.success('¡Pre-registro exitoso!');
      }
    } catch {
      toast.error('Error al registrar. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-off-white">
      <SEOHead
        title="RestroGrowth - Inversión y Emprendimiento Gastronómico | RestroWizard"
        description="Conecta inversionistas con restauranteros. Valida tu concepto gastronómico, encuentra capital y socios estratégicos con herramientas de análisis de mercado e IA."
        canonical="https://restrowizard.lovable.app/growth"
      />
      <Header />

      {/* Hero */}
      <section className="pt-28 pb-20 bg-gradient-to-br from-purple-intense via-purple-medium to-purple-intense relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,165,219,0.15),transparent_60%)]" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-lavender-light/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-medium/20 rounded-full blur-3xl" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="bg-white/20 text-white border-white/30 mb-6 text-sm font-lato-medium">
              <Rocket className="h-4 w-4 mr-2" />
              Próximamente — Lanzamiento Q3 2026
            </Badge>

            <img src={restrogrowthLogo} alt="RestroGrowth" className="h-16 md:h-20 w-auto mx-auto mb-6 brightness-0 invert" />

            <p className="text-xl md:text-2xl text-white/90 font-lato-regular mb-4 max-w-3xl mx-auto">
              La plataforma que conecta inversionistas con restauranteros para crear el futuro de la gastronomía
            </p>
            <p className="text-white/60 font-lato-light mb-10">
              Emprendimiento · Inversión · Expansión
            </p>

            <div className="flex flex-wrap justify-center gap-8 text-white/80">
              <div className="text-center"><div className="text-3xl font-headline text-white">2,340+</div><div className="text-sm font-lato-light">Pre-registrados</div></div>
              <div className="text-center"><div className="text-3xl font-headline text-white">$15M+</div><div className="text-sm font-lato-light">Capital interesado</div></div>
              <div className="text-center"><div className="text-3xl font-headline text-white">180+</div><div className="text-sm font-lato-light">Proyectos en espera</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-headline text-purple-intense mb-4">Tres Pilares, Un Ecosistema</h2>
            <p className="text-dark-gray font-lato-regular max-w-2xl mx-auto">RestroGrowth conecta los tres actores clave del emprendimiento gastronómico en una sola plataforma inteligente.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pillars.map(pillar => (
              <Card key={pillar.title} className="border-2 border-transparent hover:border-purple-medium/30 hover:shadow-xl transition-all group">
                <CardContent className="pt-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-medium to-purple-intense flex items-center justify-center mb-5">
                    <pillar.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-headline text-purple-intense mb-3">{pillar.title}</h3>
                  <p className="text-dark-gray font-lato-regular text-sm mb-5">{pillar.description}</p>
                  <ul className="space-y-2">
                    {pillar.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-soft-black font-lato-regular">
                        <CheckCircle className="h-4 w-4 text-purple-medium flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pre-Registration */}
      <section className="py-20 bg-gradient-to-br from-purple-intense to-purple-medium relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(212,165,219,0.15),transparent_50%)]" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-xl mx-auto text-center">
            <Rocket className="h-12 w-12 text-lavender-light mx-auto mb-4" />
            <h2 className="text-3xl font-headline text-white mb-4">Sé de los Primeros</h2>
            <p className="text-white/80 font-lato-regular mb-8">Pre-regístrate y obtén acceso anticipado a la plataforma cuando lancemos. Sin costo, sin compromiso.</p>

            {submitted ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-headline text-white mb-2">¡Registro Exitoso!</h3>
                <p className="text-white/80 font-lato-regular">Te notificaremos cuando RestroGrowth esté listo. Mientras tanto, explora las demás soluciones del ecosistema Restro.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 space-y-4">
                <Input type="email" placeholder="Tu correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12" />
                <Select value={interestType} onValueChange={setInterestType}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white h-12">
                    <SelectValue placeholder="¿Cuál es tu interés?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="investor">Soy Inversionista</SelectItem>
                    <SelectItem value="restaurateur">Soy Restaurantero</SelectItem>
                    <SelectItem value="entrepreneur">Tengo un Nuevo Concepto</SelectItem>
                    <SelectItem value="curious">Solo quiero explorar</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" size="lg" disabled={isSubmitting} className="w-full bg-white text-purple-intense hover:bg-off-white font-lato-bold h-12">
                  Pre-registrarme <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <p className="text-white/50 text-xs font-lato-light">Sin spam. Solo una notificación cuando lancemos.</p>
              </form>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Growth;
