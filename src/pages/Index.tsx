import Header from '../components/Header';
import Hero from '../components/Hero';
import ProductShowcase from '../components/ProductShowcase';
import ResultsSection from '../components/ResultsSection';
import Testimonials from '../components/Testimonials';
import FinalCTA from '../components/FinalCTA';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';

const Index = () => {
  return (
    <div className="min-h-screen bg-white font-body">
      <SEOHead
        title="RestroWizard – Software con IA para restaurantes"
        description="Prime cost y P&L en tiempo real, POS, inventario, turnos, sitio web y reservas, con un copiloto de IA para restaurantes y bares."
        canonical="https://restrowizard.co/"
      />
      <Header />
      <main>
        <Hero />
        <div id="producto">
          <ProductShowcase />
        </div>
        <div id="resultados">
          <ResultsSection />
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
