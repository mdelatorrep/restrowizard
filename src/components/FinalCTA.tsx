import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowRight, faShieldAlt, faClock, faHeadset, 
  faBolt, faCheck, faUsers
} from '@fortawesome/free-solid-svg-icons';

const FinalCTA = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState<'restaurant' | 'consultant'>('restaurant');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Could pre-fill email in auth flow
    navigate('/auth');
  };

  const guarantees = [
    { icon: faShieldAlt, text: 'Sin tarjeta de crédito' },
    { icon: faClock, text: 'Configura en 5 minutos' },
    { icon: faHeadset, text: 'Soporte humano 24/7' },
  ];

  return (
    <section id="cta-final" className="py-24 bg-gradient-to-br from-purple-intense via-purple-medium to-purple-intense relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-lavender-light/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Urgency Badge */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-sm font-lato-medium text-green-300">
                347 restaurantes se registraron esta semana
              </span>
            </div>
          </div>

          {/* Main Headline */}
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-5xl font-headline text-white mb-4 leading-tight">
              Recupera <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">$2,000+</span> el Primer Mes
              <br />
              <span className="text-lavender-light">o Te Devolvemos el Acceso</span>
            </h2>
            <p className="text-lg md:text-xl font-lato-light text-white/80 max-w-2xl mx-auto">
              La IA de RestroWizard encuentra oportunidades de ahorro que tú no puedes ver. 
              Garantizado.
            </p>
          </div>

          {/* Sign Up Form Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 mb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User Type Toggle */}
              <div className="flex justify-center gap-2 p-1 bg-white/10 rounded-xl">
                <button
                  type="button"
                  onClick={() => setUserType('restaurant')}
                  className={`flex-1 py-3 px-4 rounded-lg font-lato-medium transition-all ${
                    userType === 'restaurant'
                      ? 'bg-white text-purple-intense'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  🍽️ Soy Restaurante
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('consultant')}
                  className={`flex-1 py-3 px-4 rounded-lg font-lato-medium transition-all ${
                    userType === 'consultant'
                      ? 'bg-white text-purple-intense'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  👔 Soy Consultor
                </button>
              </div>

              {/* Email Input */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 font-lato-regular"
                  />
                </div>
                <button
                  type="submit"
                  className="group bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-lato-bold px-8 py-4 rounded-xl shadow-xl shadow-green-500/20 transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <FontAwesomeIcon icon={faBolt} className="text-yellow-300" />
                  Comenzar Diagnóstico Gratis
                  <FontAwesomeIcon icon={faArrowRight} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* What's Included */}
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                {[
                  'Análisis completo de tu negocio',
                  'Plan de acción personalizado',
                  'Acceso a los 7 módulos de IA',
                  'Soporte prioritario 30 días'
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-white/70">
                    <FontAwesomeIcon icon={faCheck} className="text-green-400 text-xs" />
                    <span className="font-lato-light">{item}</span>
                  </div>
                ))}
              </div>
            </form>
          </div>

          {/* Guarantees */}
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            {guarantees.map((guarantee, index) => (
              <div key={index} className="flex items-center gap-2 text-white/80">
                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon icon={guarantee.icon} className="text-green-400 text-sm" />
                </div>
                <span className="font-lato-light">{guarantee.text}</span>
              </div>
            ))}
          </div>

          {/* Social Proof */}
          <div className="text-center">
            <div className="inline-flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-full px-6 py-3 border border-white/10">
              <div className="flex -space-x-2">
                {['JM', 'SK', 'LP', 'RC'].map((initials, index) => (
                  <div 
                    key={index}
                    className="w-8 h-8 bg-gradient-to-br from-purple-medium to-purple-intense rounded-full flex items-center justify-center text-white text-xs font-lato-bold border-2 border-purple-intense"
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <span className="text-white/70 text-sm font-lato-light">
                <span className="font-lato-bold text-white">+500</span> restaurantes ya confían en nosotros
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
