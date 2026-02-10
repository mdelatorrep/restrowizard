import Header from '../components/Header';
import Hero from '../components/Hero';
import ProductShowcase from '../components/ProductShowcase';
import ResultsSection from '../components/ResultsSection';
import EcosystemMinimal from '../components/EcosystemMinimal';
import Testimonials from '../components/Testimonials';
import FinalCTA from '../components/FinalCTA';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';

const Index = () => {
  return (
    <div className="min-h-screen bg-white font-body">
      <SEOHead
        title="RestroWizard - Plataforma IA para Restaurantes | Gestión, Empleo, Formación y Servicios"
        description="Ecosistema integral con IA para restaurantes: diagnóstico de madurez, copiloto operativo, bolsa de empleo, formación, marketplace de proveedores y plataforma de inversión."
        canonical="https://restrowizard.lovable.app/"
      />
      <Header />
      <main>
        <Hero />
        <ProductShowcase />
        <ResultsSection />
        <div id="soluciones">
          <EcosystemMinimal />
        </div>
        <div id="testimonios">
          <Testimonials />
        </div>
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
