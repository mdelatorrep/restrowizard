import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Building2, Users, Target, Lightbulb } from 'lucide-react';
import SEOHead from '@/components/SEOHead';

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Sobre Nosotros | RestroWizard" description="Conoce al equipo detrás de RestroWizard, la plataforma integral con IA para la industria gastronómica." canonical="https://restrowizard.lovable.app/about" />
      <Header />
      <section className="pt-28 pb-16 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <h1 className="text-4xl font-headline text-foreground mb-4">Sobre RestroWizard</h1>
          <p className="text-lg text-muted-foreground font-lato-regular">
            Somos una plataforma tecnológica que combina inteligencia artificial con conocimiento gastronómico para transformar la forma en que los restaurantes operan, crecen y prosperan.
          </p>
        </div>
      </section>
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              { icon: Target, title: 'Misión', desc: 'Democratizar el acceso a herramientas de gestión inteligente para restaurantes de todos los tamaños en Latinoamérica.' },
              { icon: Lightbulb, title: 'Visión', desc: 'Ser el ecosistema líder que conecta la tecnología con la pasión gastronómica.' },
              { icon: Users, title: 'Equipo', desc: 'Profesionales de tecnología, gastronomía y consultoría unidos por la innovación.' },
              { icon: Building2, title: 'Presencia', desc: 'Operando en Colombia, México, Chile, Argentina y expandiéndonos por toda la región.' },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-headline text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground font-lato-regular">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default About;
