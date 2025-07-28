import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Hero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section 
      className="hologram-effect relative bg-cover bg-center text-off-white pt-32 pb-20 md:pt-48 md:pb-32"
      style={{
        backgroundImage: `linear-gradient(rgba(62, 16, 100, 0.7), rgba(26, 26, 26, 0.7)), url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop')`
      }}
    >
      <div className="container mx-auto px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-headline mb-4 text-shadow-lg">
          4 Copilotos IA que Revolucionarán tu Restaurante
        </h1>
        <p className="text-lg md:text-2xl font-lato-light max-w-4xl mx-auto mb-8 text-shadow">
          Finanzas predictivas, talento optimizado, operaciones inteligentes y menús rentables. 
          <span className="font-lato-bold">Todo automatizado por IA</span> para que tú te enfoques en la gastronomía.
        </p>
        <button 
          onClick={() => {
            if (user) {
              navigate('/diagnosis');
            } else {
              navigate('/auth');
            }
          }}
          className="bg-primary text-primary-foreground font-lato-bold text-xl px-8 py-4 rounded-lg shadow-xl transform hover:scale-105 transition-smooth inline-block border-2 border-accent"
        >
          Realizar mi Diagnóstico Gratis
        </button>
        <p className="mt-4 text-sm font-lato-light italic">
          Sin tarjeta de crédito. Recibe tu primer reporte en minutos.
        </p>
      </div>
    </section>
  );
};

export default Hero;