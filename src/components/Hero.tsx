import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faChartLine, faUsers, faUtensils, faArrowRight, faStar } from '@fortawesome/free-solid-svg-icons';

const Hero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section 
      className="relative min-h-screen bg-cover bg-center text-off-white pt-28 pb-16 md:pt-36 md:pb-24 flex items-center"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(62, 16, 100, 0.85) 0%, rgba(147, 51, 158, 0.75) 50%, rgba(26, 26, 26, 0.9) 100%), url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop')`
      }}
    >
      {/* Floating AI Badge */}
      <div className="absolute top-24 right-8 md:right-16 animate-float hidden md:flex">
        <div className="bg-accent/20 backdrop-blur-sm border border-accent/50 rounded-full px-4 py-2 flex items-center gap-2">
          <FontAwesomeIcon icon={faRobot} className="text-accent" />
          <span className="text-sm font-lato-medium">Potenciado por IA</span>
        </div>
      </div>

      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Main CTA */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <FontAwesomeIcon icon={faStar} className="text-yellow-400" />
              <span className="text-sm font-lato-medium">+500 restaurantes transformados</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline mb-6 leading-tight">
              Tu Co-Piloto de IA para la{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-lavender-light to-accent">
                Rentabilidad
              </span>{' '}
              de tu Restaurante
            </h1>
            
            <p className="text-lg md:text-xl font-lato-light max-w-xl mx-auto lg:mx-0 mb-8 text-off-white/90">
              <strong className="font-lato-bold">4 módulos de IA</strong> que automatizan finanzas, personal, operaciones y menú. 
              Decisiones inteligentes, resultados medibles desde el primer mes.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <button 
                onClick={() => user ? navigate('/diagnosis') : navigate('/auth')}
                className="group bg-primary hover:bg-primary/90 text-primary-foreground font-lato-bold text-lg px-8 py-4 rounded-xl shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
              >
                Diagnóstico Gratis
                <FontAwesomeIcon icon={faArrowRight} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => navigate('/auth')}
                className="bg-white/10 backdrop-blur-sm border-2 border-white/30 hover:bg-white/20 text-white font-lato-bold text-lg px-8 py-4 rounded-xl transition-all duration-300"
              >
                Soy Consultor
              </button>
            </div>
            
            <p className="text-sm font-lato-light text-off-white/70 flex items-center justify-center lg:justify-start gap-2">
              <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Sin tarjeta de crédito • Resultados en minutos
            </p>
          </div>
          
          {/* Right Column - AI Modules Preview */}
          <div className="hidden lg:block">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-1">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
                  <FontAwesomeIcon icon={faChartLine} className="text-white text-xl" />
                </div>
                <h3 className="font-headline text-lg mb-2">Finanzas IA</h3>
                <p className="text-sm text-off-white/70 font-lato-light">Predice rentabilidad y detecta fugas de dinero automáticamente</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-1 mt-8">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
                  <FontAwesomeIcon icon={faUsers} className="text-white text-xl" />
                </div>
                <h3 className="font-headline text-lg mb-2">Talento IA</h3>
                <p className="text-sm text-off-white/70 font-lato-light">Optimiza horarios y encuentra el personal ideal</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-1">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-600 rounded-xl flex items-center justify-center mb-4">
                  <FontAwesomeIcon icon={faRobot} className="text-white text-xl" />
                </div>
                <h3 className="font-headline text-lg mb-2">Operaciones IA</h3>
                <p className="text-sm text-off-white/70 font-lato-light">Analiza datos y recupera clientes automáticamente</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-1 mt-8">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-600 rounded-xl flex items-center justify-center mb-4">
                  <FontAwesomeIcon icon={faUtensils} className="text-white text-xl" />
                </div>
                <h3 className="font-headline text-lg mb-2">Menú IA</h3>
                <p className="text-sm text-off-white/70 font-lato-light">Diseña menús rentables y predice inventario</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;