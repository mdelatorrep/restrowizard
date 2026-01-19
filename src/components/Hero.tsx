import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserType } from '@/hooks/useUserType';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRobot, faChartLine, faUsers, faUtensils, faArrowRight, 
  faStar, faPlay, faBolt, faShieldAlt, faClock, faGlobe,
  faCheck, faTimes
} from '@fortawesome/free-solid-svg-icons';

const Hero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userType } = useUserType();
  const [counter, setCounter] = useState(2847892);
  const [showDemo, setShowDemo] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const getLoggedInPath = () => {
    if (userType === 'consultant') return '/c/dashboard';
    if (userType === 'restaurant_owner') return '/r/dashboard';
    return '/onboarding';
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter(prev => prev + Math.floor(Math.random() * 100) + 25);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 4);
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

  const features = [
    { icon: faChartLine, label: 'Finanzas IA', color: 'from-green-400 to-emerald-500' },
    { icon: faGlobe, label: 'Sitio Web Propio', color: 'from-blue-400 to-cyan-500' },
    { icon: faUsers, label: 'Reservas Online', color: 'from-purple-400 to-pink-500' },
    { icon: faUtensils, label: 'Delivery Integrado', color: 'from-orange-400 to-red-500' },
  ];

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Animated Video-like Background */}
      <div className="absolute inset-0">
        {/* Base Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-intense via-purple-medium to-soft-black"></div>
        
        {/* Animated Mesh Gradient */}
        <div className="absolute inset-0 opacity-60">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-purple-medium/40 via-transparent to-transparent animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-accent/30 via-transparent to-transparent animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 5}s`,
              }}
            ></div>
          ))}
        </div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}></div>
        
        {/* Glowing Orbs */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-purple-medium/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-lavender-light/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative container mx-auto px-6 pt-28 pb-16 md:pt-36 md:pb-24 min-h-screen flex items-center">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">
          {/* Left Column */}
          <div className="text-center lg:text-left text-off-white space-y-6">
            {/* Live Savings Badge */}
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-md border border-green-500/40 rounded-full px-5 py-3 animate-glow">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-sm md:text-base font-lato-bold text-green-300 tabular-nums">
                {formatCurrency(counter)} ahorrados hoy
              </span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-headline leading-tight">
              <span className="block mb-2">Tu Restaurante</span>
              <span className="relative inline-block">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-300 to-cyan-400 animate-gradient-text">
                  100% Digital
                </span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <path d="M2 8C80 3 220 3 298 8" stroke="url(#hero-underline)" strokeWidth="4" strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="hero-underline" x1="0" y1="0" x2="300" y2="0">
                      <stop stopColor="#4ade80"/>
                      <stop offset="0.5" stopColor="#34d399"/>
                      <stop offset="1" stopColor="#22d3ee"/>
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              <span className="block mt-2 text-off-white/90">en Una Plataforma</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg md:text-xl font-lato-light max-w-xl mx-auto lg:mx-0 text-off-white/80">
              <strong className="font-lato-bold text-white">Sitio web + Reservas + Delivery + IA.</strong>
              {' '}Todo integrado para que tú te enfoques en cocinar.
            </p>
            
            {/* Animated Feature Pills */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-3">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-500 ${
                    activeFeature === index
                      ? `bg-gradient-to-r ${feature.color} text-white border-transparent shadow-lg scale-105`
                      : 'bg-white/5 border-white/20 text-white/70'
                  }`}
                >
                  <FontAwesomeIcon icon={feature.icon} className="text-sm" />
                  <span className="text-sm font-lato-medium">{feature.label}</span>
                </div>
              ))}
            </div>
            
            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-6 py-2">
              <div className="flex items-center gap-2 text-sm text-off-white/70">
                <FontAwesomeIcon icon={faShieldAlt} className="text-green-400" />
                <span>Sin tarjeta requerida</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-off-white/70">
                <FontAwesomeIcon icon={faClock} className="text-cyan-400" />
                <span>Activo en 10 min</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-off-white/70">
                <FontAwesomeIcon icon={faStar} className="text-yellow-400" />
                <span>+500 restaurantes</span>
              </div>
            </div>
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
              <button 
                onClick={() => user ? navigate(getLoggedInPath()) : navigate('/auth')}
                className="group relative bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-lato-bold text-lg px-8 py-5 rounded-2xl shadow-2xl shadow-green-500/30 transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                <FontAwesomeIcon icon={faBolt} className="text-yellow-300 text-xl" />
                <span>{user ? 'Ir al Dashboard' : 'Crear Mi Sitio Web Gratis'}</span>
                <FontAwesomeIcon icon={faArrowRight} className="group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button 
                onClick={() => setShowDemo(true)}
                className="group bg-white/10 backdrop-blur-md border-2 border-white/30 hover:bg-white/20 hover:border-white/50 text-white font-lato-bold text-lg px-8 py-5 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3"
              >
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all">
                  <FontAwesomeIcon icon={faPlay} className="text-lg ml-0.5" />
                </div>
                <span>Ver Demo</span>
              </button>
            </div>
            
            {/* Secondary CTA */}
            <button 
              onClick={() => document.getElementById('consultores')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-lavender-light hover:text-white transition-colors font-lato-medium flex items-center gap-2 mx-auto lg:mx-0 group"
            >
              <span>¿Eres consultor gastronómico?</span>
              <FontAwesomeIcon icon={faArrowRight} className="text-sm group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
          {/* Right Column - Floating Dashboard */}
          <div className="hidden lg:block relative">
            {/* Main Dashboard Card */}
            <div className="relative bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl transform hover:scale-[1.02] transition-transform duration-500">
              {/* Browser Chrome */}
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 bg-white/10 rounded-lg px-4 py-1.5 text-off-white/60 text-sm font-mono">
                  turestaurante.restrowizard.app
                </div>
              </div>
              
              {/* Dashboard Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-medium to-purple-intense rounded-2xl flex items-center justify-center shadow-lg">
                    <FontAwesomeIcon icon={faRobot} className="text-white text-xl" />
                  </div>
                  <div>
                    <h3 className="font-headline text-white text-lg">RestroWizard</h3>
                    <p className="text-xs text-green-400 flex items-center gap-1">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      IA activa
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-off-white/60">Hoy</p>
                  <p className="text-lg font-headline text-green-400">+$4,230</p>
                </div>
              </div>
              
              {/* KPI Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-xl p-4 border border-green-500/20">
                  <p className="text-xs text-off-white/60 mb-1">Reservas Hoy</p>
                  <p className="text-2xl font-headline text-green-400">24</p>
                  <p className="text-xs text-green-400/70">↑ +8 vs ayer</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-xl p-4 border border-blue-500/20">
                  <p className="text-xs text-off-white/60 mb-1">Pedidos Web</p>
                  <p className="text-2xl font-headline text-blue-400">47</p>
                  <p className="text-xs text-blue-400/70">↑ +12 vs ayer</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-xl p-4 border border-purple-500/20">
                  <p className="text-xs text-off-white/60 mb-1">Rentabilidad</p>
                  <p className="text-2xl font-headline text-purple-400">18.5%</p>
                  <p className="text-xs text-purple-400/70">↑ +3.2% mes</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500/20 to-orange-500/5 rounded-xl p-4 border border-orange-500/20">
                  <p className="text-xs text-off-white/60 mb-1">Alertas IA</p>
                  <p className="text-2xl font-headline text-orange-400">3</p>
                  <p className="text-xs text-orange-400/70">1 urgente</p>
                </div>
              </div>
              
              {/* AI Alert */}
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/10 border border-orange-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-500/30 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
                    <FontAwesomeIcon icon={faBolt} className="text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-lato-bold text-orange-300 mb-1">🤖 Alerta de IA</p>
                    <p className="text-xs text-off-white/70">Tienes 3 reservas para las 8pm pero solo 2 meseros programados. ¿Quieres que contacte a María?</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating Cards */}
            <div className="absolute -left-16 top-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 shadow-xl animate-float border border-green-400/30">
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faGlobe} className="text-white text-xl" />
                <div>
                  <p className="text-sm font-lato-bold text-white">Sitio Web</p>
                  <p className="text-xs text-white/70">Publicado ✓</p>
                </div>
              </div>
            </div>
            
            <div className="absolute -right-12 top-1/3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 shadow-xl animate-float border border-blue-400/30" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faUsers} className="text-white text-xl" />
                <div>
                  <p className="text-sm font-lato-bold text-white">Nueva Reserva</p>
                  <p className="text-xs text-white/70">Mesa para 4</p>
                </div>
              </div>
            </div>
            
            <div className="absolute -left-8 bottom-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-4 shadow-xl animate-float border border-purple-400/30" style={{ animationDelay: '1s' }}>
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faChartLine} className="text-white text-xl" />
                <div>
                  <p className="text-sm font-lato-bold text-white">+$1,200</p>
                  <p className="text-xs text-white/70">IA ahorró hoy</p>
                </div>
              </div>
            </div>
            
            <div className="absolute -right-4 bottom-24 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-4 shadow-xl animate-float border border-orange-400/30" style={{ animationDelay: '1.5s' }}>
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faUtensils} className="text-white text-xl" />
                <div>
                  <p className="text-sm font-lato-bold text-white">Nuevo Pedido</p>
                  <p className="text-xs text-white/70">Delivery #247</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="flex flex-col items-center gap-2">
          <span className="text-off-white/50 text-xs font-lato-light">Descubre más</span>
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1.5 h-3 bg-white/60 rounded-full mt-2 animate-bounce"></div>
          </div>
        </div>
      </div>

      {/* Demo Modal */}
      {showDemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowDemo(false)}>
          <div className="bg-gradient-to-br from-soft-black to-purple-intense/50 rounded-3xl p-8 max-w-3xl w-full border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline text-2xl text-white">Demo RestroWizard</h3>
              <button onClick={() => setShowDemo(false)} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="aspect-video bg-gradient-to-br from-purple-intense to-purple-medium rounded-2xl flex items-center justify-center mb-6 overflow-hidden relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
              <div className="text-center text-white relative z-10">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-white/30 hover:scale-110 transition-all">
                  <FontAwesomeIcon icon={faPlay} className="text-3xl ml-1" />
                </div>
                <p className="font-lato-medium text-lg">Video demo interactivo</p>
                <p className="font-lato-light text-white/60">Próximamente</p>
              </div>
            </div>
            <div className="text-center">
              <button 
                onClick={() => { setShowDemo(false); navigate('/auth'); }}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-lato-bold px-10 py-4 rounded-xl shadow-lg transition-all transform hover:scale-105"
              >
                <FontAwesomeIcon icon={faBolt} className="mr-2 text-yellow-300" />
                Crear Mi Cuenta Gratis
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Hero;
