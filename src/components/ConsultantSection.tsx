import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserTie, faChartLine, faBell, faFileAlt, 
  faLink, faArrowRight, faCheck, faStar, faUsers
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

const ConsultantSection = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: faUsers,
      title: 'Gestiona 50+ clientes',
      description: 'Dashboard unificado para ver todos tus clientes de un vistazo'
    },
    {
      icon: faBell,
      title: 'Alertas automáticas',
      description: 'Recibe notificaciones proactivas por cada cliente'
    },
    {
      icon: faFileAlt,
      title: 'Reportes con un clic',
      description: 'Genera informes ejecutivos profesionales en segundos'
    },
    {
      icon: faLink,
      title: 'Link de referidos',
      description: 'Comparte tu link y gana comisiones por cada cliente'
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/20 rounded-full px-4 py-2 mb-6 border border-blue-500/30">
              <FontAwesomeIcon icon={faUserTie} className="text-blue-400" />
              <span className="text-sm font-lato-medium text-blue-300">Para consultores gastronómicos</span>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-headline text-white mb-6 leading-tight">
              Potencia tu{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Práctica de Consultoría
              </span>
            </h2>
            
            <p className="text-lg font-lato-light text-white/70 mb-8">
              RestroWizard te da superpoderes para manejar más clientes con menos esfuerzo. 
              Automatiza el análisis, impresiona con reportes profesionales y enfócate en lo que mejor haces: asesorar.
            </p>
            
            {/* Benefits Grid */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {benefits.map((benefit, index) => (
                <div 
                  key={index}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-3">
                    <FontAwesomeIcon icon={benefit.icon} className="text-white" />
                  </div>
                  <h3 className="font-lato-bold text-white mb-1">{benefit.title}</h3>
                  <p className="text-sm text-white/60 font-lato-light">{benefit.description}</p>
                </div>
              ))}
            </div>
            
            {/* CTA */}
            <button 
              onClick={() => navigate('/auth')}
              className="group bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-lato-bold text-lg px-8 py-4 rounded-xl shadow-xl shadow-blue-500/20 transform hover:scale-105 transition-all duration-300 inline-flex items-center gap-3"
            >
              Comenzar como Consultor PRO
              <FontAwesomeIcon icon={faArrowRight} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
          {/* Right Column - Testimonial */}
          <div className="relative">
            {/* Main Testimonial Card */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
              {/* Quote */}
              <div className="mb-6">
                <svg className="w-12 h-12 text-blue-400/30 mb-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="text-xl font-lato-light text-white leading-relaxed mb-4">
                  "Antes tardaba <span className="text-blue-400 font-lato-bold">4 horas por cliente</span> analizando datos. 
                  Ahora gestiono <span className="text-blue-400 font-lato-bold">20 clientes</span> en menos tiempo. 
                  RestroWizard me convirtió en un consultor con superpoderes de IA."
                </p>
              </div>
              
              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-lato-bold text-lg">
                  MR
                </div>
                <div>
                  <p className="font-lato-bold text-white">María Rodríguez</p>
                  <p className="text-sm text-white/60 font-lato-light">Consultora Gastronómica • CDMX</p>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <FontAwesomeIcon key={i} icon={faStar} className="text-yellow-400 text-sm" />
                  ))}
                </div>
              </div>
              
              {/* Stats */}
              <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-headline text-blue-400">20+</p>
                  <p className="text-xs text-white/50 font-lato-light">Clientes activos</p>
                </div>
                <div>
                  <p className="text-2xl font-headline text-green-400">-75%</p>
                  <p className="text-xs text-white/50 font-lato-light">Tiempo análisis</p>
                </div>
                <div>
                  <p className="text-2xl font-headline text-purple-400">3x</p>
                  <p className="text-xs text-white/50 font-lato-light">Más ingresos</p>
                </div>
              </div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full px-4 py-2 text-white text-sm font-lato-bold shadow-lg animate-float">
              <FontAwesomeIcon icon={faCheck} className="mr-2" />
              Verificado
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ConsultantSection;
