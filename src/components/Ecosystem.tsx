import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, faUsers, faRobot, faUtensils, 
  faBrain, faCheckCircle, faArrowRight 
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

const Ecosystem = () => {
  const navigate = useNavigate();

  const modules = [
    {
      icon: faChartLine,
      gradient: 'from-green-400 to-emerald-600',
      title: 'Finanzas IA',
      subtitle: 'Control Financiero Inteligente',
      description: 'Predice tu rentabilidad antes de que termine el mes. Detecta fugas de dinero y sugiere precios óptimos automáticamente.',
      features: [
        'Proyecciones de rentabilidad con 95% precisión',
        'Alertas automáticas de costos elevados',
        'Simulador de escenarios financieros'
      ],
      metric: '+15%',
      metricLabel: 'rentabilidad promedio'
    },
    {
      icon: faUsers,
      gradient: 'from-blue-400 to-indigo-600',
      title: 'Talento IA',
      subtitle: 'Gestión de Personal Eficiente',
      description: 'Optimiza horarios basados en demanda real. Encuentra y retiene al personal ideal para tu equipo.',
      features: [
        'Horarios optimizados por demanda',
        'Conexión con candidatos ideales',
        'Programas de capacitación efectivos'
      ],
      metric: '-30%',
      metricLabel: 'rotación de personal'
    },
    {
      icon: faRobot,
      gradient: 'from-purple-400 to-pink-600',
      title: 'Operaciones IA',
      subtitle: 'Análisis de Operaciones Avanzado',
      description: 'Convierte tus datos en acciones claras. Recupera clientes y automatiza tu marketing.',
      features: [
        'Reportes accionables diarios',
        'Programas de lealtad inteligentes',
        'Recuperación automática de clientes'
      ],
      metric: '+25%',
      metricLabel: 'clientes recurrentes'
    },
    {
      icon: faUtensils,
      gradient: 'from-orange-400 to-red-600',
      title: 'Menú IA',
      subtitle: 'Optimización de Menú e Inventario',
      description: 'Diseña menús que maximizan ganancias. Predice necesidades de stock y elimina desperdicios.',
      features: [
        'Simulador de rentabilidad por plato',
        'Predicción precisa de inventario',
        'Reducción de merma automática'
      ],
      metric: '-40%',
      metricLabel: 'desperdicio de alimentos'
    }
  ];

  return (
    <section id="ecosistema" className="py-24 bg-gradient-to-b from-soft-black to-dark-gray text-off-white">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-medium/20 rounded-full px-4 py-2 mb-6">
            <FontAwesomeIcon icon={faBrain} className="text-purple-medium" />
            <span className="text-sm font-lato-medium text-purple-medium">Potenciado por OpenAI</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-headline mb-6">
            4 Co-Pilotos de IA que{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lavender-light to-accent">
              Trabajan 24/7
            </span>
          </h2>
          
          <p className="max-w-3xl mx-auto text-lg font-lato-light text-off-white/80">
            Cada módulo resuelve un problema crítico de tu restaurante. 
            <strong className="font-lato-bold text-off-white"> Trabajan unidos para maximizar tu rentabilidad</strong> mientras tú te enfocas en la gastronomía.
          </p>
        </div>
        
        {/* Modules Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {modules.map((module, index) => (
            <div 
              key={index}
              className="group bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-500 hover:transform hover:-translate-y-2"
            >
              <div className="flex items-start justify-between mb-6">
                <div className={`w-16 h-16 bg-gradient-to-br ${module.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <FontAwesomeIcon icon={module.icon} className="text-white text-2xl" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-headline text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                    {module.metric}
                  </div>
                  <div className="text-xs text-off-white/60 font-lato-light">{module.metricLabel}</div>
                </div>
              </div>
              
              <h3 className="text-2xl font-headline text-lavender-light mb-2">{module.title}</h3>
              <p className="text-sm text-purple-medium/80 font-lato-medium mb-4">{module.subtitle}</p>
              <p className="font-lato-light text-off-white/70 mb-6">{module.description}</p>
              
              <div className="space-y-3">
                {module.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 text-sm" />
                    <span className="text-sm text-off-white/80 font-lato-light">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* CTA */}
        <div className="text-center">
          <button 
            onClick={() => navigate('/auth')}
            className="group bg-gradient-to-r from-purple-medium to-purple-intense hover:from-purple-intense hover:to-purple-medium text-white font-lato-bold text-lg px-10 py-5 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 inline-flex items-center gap-3"
          >
            Activa tu Co-Piloto de IA
            <FontAwesomeIcon icon={faArrowRight} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="mt-4 text-sm text-off-white/50 font-lato-light">
            Comienza gratis • Sin compromiso • Resultados garantizados
          </p>
        </div>
      </div>
    </section>
  );
};

export default Ecosystem;