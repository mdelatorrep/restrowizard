import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowRight, faShieldAlt, faClock, faHeadset, 
  faBolt, faCheck, faUsers, faGlobe, faRocket,
  faCalendarCheck, faShoppingCart, faChartLine
} from '@fortawesome/free-solid-svg-icons';

const FinalCTA = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState<'restaurant' | 'consultant'>('restaurant');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/auth');
  };

  const guarantees = [
    { icon: faShieldAlt, text: 'Sin tarjeta de crédito' },
    { icon: faClock, text: 'Activo en 10 minutos' },
    { icon: faHeadset, text: 'Soporte humano 24/7' },
  ];

  const restaurantFeatures = [
    { icon: faGlobe, text: 'Sitio web profesional' },
    { icon: faCalendarCheck, text: 'Sistema de reservas' },
    { icon: faShoppingCart, text: 'Delivery integrado' },
    { icon: faChartLine, text: '7 módulos de IA' },
  ];

  const consultantFeatures = [
    { icon: faUsers, text: 'Gestiona 50+ clientes' },
    { icon: faChartLine, text: 'Reportes automáticos' },
    { icon: faBolt, text: 'Alertas proactivas' },
    { icon: faRocket, text: 'Comisiones por referidos' },
  ];

  const features = userType === 'restaurant' ? restaurantFeatures : consultantFeatures;

  return (
    <section id="cta-final" className="py-24 bg-gradient-to-br from-purple-intense via-purple-medium to-purple-intense relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-lavender-light/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-green-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }}></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Live Badge */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-500/30 rounded-full px-5 py-2.5 animate-pulse">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-sm font-lato-bold text-green-300">
                847 restaurantes crearon su sitio web esta semana
              </span>
            </div>
          </div>

          {/* Main Headline */}
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-headline text-white mb-6 leading-tight">
              {userType === 'restaurant' ? (
                <>
                  Tu Restaurante{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400">
                    100% Digital
                  </span>
                  <br />
                  <span className="text-lavender-light">En Menos de 10 Minutos</span>
                </>
              ) : (
                <>
                  Escala tu{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400">
                    Consultoría
                  </span>
                  <br />
                  <span className="text-lavender-light">Con Superpoderes de IA</span>
                </>
              )}
            </h2>
            <p className="text-lg md:text-xl font-lato-light text-white/80 max-w-2xl mx-auto">
              {userType === 'restaurant' 
                ? 'Sitio web + Reservas + Delivery + 7 módulos de IA. Todo integrado. Sin conocimientos técnicos.'
                : 'Gestiona más clientes con menos esfuerzo. Reportes automáticos, alertas proactivas y comisiones por referidos.'}
            </p>
          </div>

          {/* Sign Up Form Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-10 border border-white/20 shadow-2xl mb-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User Type Toggle */}
              <div className="flex justify-center gap-2 p-1.5 bg-white/10 rounded-2xl max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => setUserType('restaurant')}
                  className={`flex-1 py-3.5 px-5 rounded-xl font-lato-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                    userType === 'restaurant'
                      ? 'bg-white text-purple-intense shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="text-lg">🍽️</span>
                  <span>Soy Restaurante</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('consultant')}
                  className={`flex-1 py-3.5 px-5 rounded-xl font-lato-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                    userType === 'consultant'
                      ? 'bg-white text-purple-intense shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="text-lg">👔</span>
                  <span>Soy Consultor</span>
                </button>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                    <FontAwesomeIcon icon={feature.icon} className="text-green-400 text-sm" />
                    <span className="text-white/80 text-sm font-lato-medium">{feature.text}</span>
                  </div>
                ))}
              </div>

              {/* Email Input */}
              <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
                <div className="flex-1">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full px-6 py-5 bg-white/10 border-2 border-white/20 rounded-2xl text-white placeholder:text-white/40 focus:outline-none focus:border-green-400/50 focus:bg-white/15 font-lato-regular text-lg transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="group bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-lato-bold px-8 py-5 rounded-2xl shadow-xl shadow-green-500/30 transition-all duration-300 flex items-center justify-center gap-3 whitespace-nowrap hover:scale-105"
                >
                  <FontAwesomeIcon icon={faBolt} className="text-yellow-300 text-xl" />
                  <span className="text-lg">{userType === 'restaurant' ? 'Crear Mi Sitio Web' : 'Comenzar Ahora'}</span>
                  <FontAwesomeIcon icon={faArrowRight} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </form>
          </div>

          {/* Guarantees */}
          <div className="flex flex-wrap justify-center gap-8 mb-10">
            {guarantees.map((guarantee, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                  <FontAwesomeIcon icon={guarantee.icon} className="text-green-400" />
                </div>
                <span className="font-lato-medium text-white/80">{guarantee.text}</span>
              </div>
            ))}
          </div>

          {/* Social Proof */}
          <div className="text-center">
            <div className="inline-flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-full px-8 py-4 border border-white/10">
              <div className="flex -space-x-3">
                {['AG', 'MR', 'JL', 'SK', 'PC'].map((initials, index) => (
                  <div 
                    key={index}
                    className="w-10 h-10 bg-gradient-to-br from-purple-medium to-purple-intense rounded-full flex items-center justify-center text-white text-xs font-lato-bold border-2 border-purple-intense shadow-lg"
                    style={{ zIndex: 5 - index }}
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <div className="text-left">
                <p className="text-white font-lato-bold">+500 restaurantes</p>
                <p className="text-white/60 text-sm font-lato-light">ya digitalizados con RestroWizard</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
