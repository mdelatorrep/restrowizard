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
import FinalCTA from '../components/FinalCTA';
import Footer from '../components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background font-body">
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
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
