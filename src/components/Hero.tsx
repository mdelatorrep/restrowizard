import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRobot, faChartLine, faUsers, faUtensils, faArrowRight, 
  faStar, faPlay, faBolt, faShieldAlt, faClock
} from '@fortawesome/free-solid-svg-icons';

const Hero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [counter, setCounter] = useState(2347892);
  const [showDemo, setShowDemo] = useState(false);

  // Animated counter effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCounter(prev => prev + Math.floor(Math.random() * 50) + 10);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0
    }).format(num);
  };

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-intense via-purple-medium/80 to-soft-black">
        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        {/* Floating Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-medium/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-lavender-light/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative container mx-auto px-6 pt-28 pb-16 md:pt-36 md:pb-24 min-h-screen flex items-center">
        <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
          {/* Left Column - Main CTA */}
          <div className="text-center lg:text-left text-off-white">
            {/* Live Counter Badge */}
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-500/30 rounded-full px-5 py-2.5 mb-6 animate-pulse">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-sm font-lato-bold text-green-300">
                {formatCurrency(counter)} ahorrados por restaurantes
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-headline mb-6 leading-tight">
              Deja de{' '}
              <span className="relative">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
                  Perder Dinero
                </span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path d="M1 5.5C47 2 153 2 199 5.5" stroke="url(#underline-gradient)" strokeWidth="3" strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="underline-gradient" x1="0" y1="0" x2="200" y2="0">
                      <stop stopColor="#f87171"/>
                      <stop offset="1" stopColor="#fb923c"/>
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-lavender-light via-white to-accent">
                Tu IA Financiera Trabaja 24/7
              </span>
            </h1>
            
            <p className="text-lg md:text-xl font-lato-light max-w-xl mx-auto lg:mx-0 mb-8 text-off-white/90">
              <strong className="font-lato-bold text-white">7 módulos de IA</strong> que detectan fugas, optimizan costos y aumentan tu rentabilidad. 
              Sin esfuerzo. Sin conocimiento técnico.
            </p>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-8">
              <div className="flex items-center gap-2 text-sm text-off-white/70">
                <FontAwesomeIcon icon={faShieldAlt} className="text-green-400" />
                <span>Sin tarjeta de crédito</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-off-white/70">
                <FontAwesomeIcon icon={faClock} className="text-blue-400" />
                <span>Resultados en 5 min</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-off-white/70">
                <FontAwesomeIcon icon={faStar} className="text-yellow-400" />
                <span>+500 restaurantes</span>
              </div>
            </div>
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <button 
                onClick={() => user ? navigate('/diagnosis') : navigate('/auth')}
                className="group relative bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-lato-bold text-lg px-8 py-4 rounded-xl shadow-2xl shadow-green-500/30 transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                <FontAwesomeIcon icon={faBolt} className="text-yellow-300" />
                Diagnóstico Gratis
                <FontAwesomeIcon icon={faArrowRight} className="group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button 
                onClick={() => setShowDemo(true)}
                className="group bg-white/10 backdrop-blur-sm border-2 border-white/30 hover:bg-white/20 hover:border-white/50 text-white font-lato-bold text-lg px-8 py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-3"
              >
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all">
                  <FontAwesomeIcon icon={faPlay} className="text-sm ml-0.5" />
                </div>
                Ver Demo en Vivo
              </button>
            </div>
            
            {/* Consultant CTA */}
            <button 
              onClick={() => navigate('/auth')}
              className="text-lavender-light hover:text-white transition-colors font-lato-medium flex items-center gap-2 mx-auto lg:mx-0"
            >
              ¿Eres consultor gastronómico?
              <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
            </button>
          </div>
          
          {/* Right Column - Interactive Dashboard Preview */}
          <div className="hidden lg:block relative">
            {/* Main Dashboard Card */}
            <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-medium to-purple-intense rounded-xl flex items-center justify-center">
                    <FontAwesomeIcon icon={faRobot} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-headline text-white text-lg">RestroWizard AI</h3>
                    <p className="text-xs text-off-white/60">Analizando tu negocio...</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-xs text-green-400">En vivo</span>
                </div>
              </div>
              
              {/* KPI Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-xs text-off-white/60 mb-1">Rentabilidad Mes</p>
                  <p className="text-2xl font-headline text-green-400">+18.5%</p>
                  <p className="text-xs text-green-400/70">↑ 3.2% vs anterior</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-xs text-off-white/60 mb-1">Ahorro Detectado</p>
                  <p className="text-2xl font-headline text-yellow-400">$4,230</p>
                  <p className="text-xs text-yellow-400/70">Esta semana</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-xs text-off-white/60 mb-1">Food Cost</p>
                  <p className="text-2xl font-headline text-off-white">28.3%</p>
                  <p className="text-xs text-green-400/70">↓ Meta: 30%</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-xs text-off-white/60 mb-1">Alertas Hoy</p>
                  <p className="text-2xl font-headline text-purple-medium">3</p>
                  <p className="text-xs text-orange-400/70">1 crítica</p>
                </div>
              </div>
              
              {/* AI Alert Card */}
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon icon={faBolt} className="text-orange-400 text-sm" />
                  </div>
                  <div>
                    <p className="text-sm font-lato-bold text-orange-300">Alerta de IA</p>
                    <p className="text-xs text-off-white/70">Tu proveedor de carnes subió 15%. Encontré 2 alternativas con mejor precio.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating Module Cards */}
            <div className="absolute -left-12 top-1/4 bg-gradient-to-br from-green-500/90 to-emerald-600/90 backdrop-blur-sm rounded-2xl p-4 border border-green-400/30 shadow-xl animate-float">
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faChartLine} className="text-white text-xl" />
                <div>
                  <p className="text-sm font-lato-bold text-white">Finanzas IA</p>
                  <p className="text-xs text-white/70">Activo</p>
                </div>
              </div>
            </div>
            
            <div className="absolute -right-8 top-1/3 bg-gradient-to-br from-blue-500/90 to-indigo-600/90 backdrop-blur-sm rounded-2xl p-4 border border-blue-400/30 shadow-xl animate-float" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faUsers} className="text-white text-xl" />
                <div>
                  <p className="text-sm font-lato-bold text-white">Talento IA</p>
                  <p className="text-xs text-white/70">3 alertas</p>
                </div>
              </div>
            </div>
            
            <div className="absolute -left-4 bottom-8 bg-gradient-to-br from-orange-500/90 to-red-600/90 backdrop-blur-sm rounded-2xl p-4 border border-orange-400/30 shadow-xl animate-float" style={{ animationDelay: '1s' }}>
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faUtensils} className="text-white text-xl" />
                <div>
                  <p className="text-sm font-lato-bold text-white">Menú IA</p>
                  <p className="text-xs text-white/70">Optimizado</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="flex flex-col items-center gap-2">
          <span className="text-off-white/50 text-xs font-lato-light">Descubre más</span>
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-bounce"></div>
          </div>
        </div>
      </div>

      {/* Demo Modal */}
      {showDemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowDemo(false)}>
          <div className="bg-soft-black rounded-3xl p-8 max-w-2xl w-full mx-4 border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline text-xl text-white">Demo RestroWizard</h3>
              <button onClick={() => setShowDemo(false)} className="text-white/50 hover:text-white">✕</button>
            </div>
            <div className="aspect-video bg-gradient-to-br from-purple-intense to-purple-medium rounded-xl flex items-center justify-center">
              <div className="text-center text-white">
                <FontAwesomeIcon icon={faPlay} className="text-4xl mb-4 opacity-50" />
                <p className="font-lato-light opacity-70">Video demo próximamente</p>
              </div>
            </div>
            <div className="mt-6 text-center">
              <button 
                onClick={() => { setShowDemo(false); navigate('/auth'); }}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-lato-bold px-8 py-3 rounded-xl"
              >
                Probar Gratis Ahora
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Hero;
