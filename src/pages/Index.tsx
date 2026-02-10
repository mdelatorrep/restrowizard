import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import WebsiteShowcase from '../components/WebsiteShowcase';
import Problem from '../components/Problem';
import LiveResults from '../components/LiveResults';
import Ecosystem from '../components/Ecosystem';
import CopilotDemo from '../components/CopilotDemo';
import ConsultantSection from '../components/ConsultantSection';
import Testimonials from '../components/Testimonials';
import Solution from '../components/Solution';
import SolutionsShowcase from '../components/SolutionsShowcase';
import FinalCTA from '../components/FinalCTA';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';

const Index = () => {
  return (
    <div className="min-h-screen bg-background font-body">
      <SEOHead
        title="RestroWizard - Plataforma IA para Restaurantes | Gestión, Empleo, Formación y Servicios"
        description="Ecosistema integral con IA para restaurantes: diagnóstico de madurez, copiloto operativo, bolsa de empleo, formación, marketplace de proveedores y plataforma de inversión."
        canonical="https://restrowizard.lovable.app/"
      />
      <Header />
      <main>
        <Hero />
        <WebsiteShowcase />
        <Problem />
        <LiveResults />
        <Ecosystem />
        <CopilotDemo />
        <div id="consultores">
          <ConsultantSection />
        </div>
        <div id="testimonios">
          <Testimonials />
        </div>
        <Solution />
        <SolutionsShowcase />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
