import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserType } from '@/hooks/useUserType';
import { ArrowDown, CheckCircle2, Rocket, Settings, Sparkles } from 'lucide-react';

const Solution = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userType } = useUserType();

  const getStartPath = () => {
    if (!user) return '/auth';
    if (userType === 'consultant') return '/c/dashboard';
    if (userType === 'restaurant_owner') return '/r/dashboard';
    return '/onboarding';
  };

  const steps = [
    {
      number: '01',
      icon: faWandMagicSparkles,
      title: 'Diagnóstico IA Gratuito',
      subtitle: '15 minutos',
      description: 'Nuestro Modelo de Madurez RestroWizard™ evalúa las 4 áreas críticas de tu restaurante y te muestra exactamente dónde está el dinero que estás perdiendo.',
      features: ['Análisis de finanzas', 'Evaluación de personal', 'Diagnóstico operativo', 'Revisión de menú']
    },
    {
      number: '02',
      icon: faCogs,
      title: 'Activación de Co-Pilotos',
      subtitle: 'Personalizado',
      description: 'Basado en tu diagnóstico, activamos los módulos de IA que necesitas. Cada uno automatiza decisiones clave con recomendaciones precisas.',
      features: ['Configuración automática', 'Integración con tus datos', 'Alertas inteligentes', 'Reportes diarios']
    },
    {
      number: '03',
      icon: faRocket,
      title: 'Transformación Continua',
      subtitle: '24/7 activo',
      description: 'RestroWizard trabaja sin descanso: predice, optimiza, alerta y automatiza. Tú ves los resultados, no el trabajo.',
      features: ['Predicciones en tiempo real', 'Optimización automática', 'Aprendizaje continuo', 'Soporte dedicado']
    }
  ];

  return (
    <section 
      id="solucion" 
      className="py-24 bg-gradient-to-b from-lavender-light/30 to-off-white relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-purple-medium/5 to-transparent pointer-events-none"></div>
      
      <div className="container mx-auto px-6 relative">
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-headline text-purple-intense mb-6">
            De Caos a Control en{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-medium to-accent">
              3 Simples Pasos
            </span>
          </h2>
          
          <p className="max-w-3xl mx-auto text-lg text-soft-black font-lato-regular">
            No más adivinar ni improvisar. <strong className="font-lato-bold">RestroWizard automatiza las 4 áreas críticas</strong> 
            {' '}para que tu restaurante funcione como relojería.
          </p>
        </div>
        
        {/* Steps */}
        <div className="relative">
          {/* Vertical line connecting steps */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-medium via-purple-intense to-accent -translate-x-1/2"></div>
          
          <div className="space-y-16 lg:space-y-24">
            {steps.map((step, index) => (
              <div 
                key={index}
                className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-16 ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* Content */}
                <div className={`flex-1 ${index % 2 === 1 ? 'lg:text-right' : ''}`}>
                  <div className={`inline-flex items-center gap-3 mb-4 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                    <span className="text-5xl font-headline text-purple-medium/30">{step.number}</span>
                    <span className="text-sm font-lato-bold text-purple-medium uppercase tracking-wider">{step.subtitle}</span>
                  </div>
                  
                  <h3 className="text-2xl md:text-3xl font-headline text-purple-intense mb-4">
                    {step.title}
                  </h3>
                  
                  <p className="text-soft-black font-lato-regular mb-6 max-w-lg">
                    {step.description}
                  </p>
                  
                  <div className={`grid grid-cols-2 gap-3 ${index % 2 === 1 ? 'lg:justify-items-end' : ''}`}>
                    {step.features.map((feature, idx) => (
                      <div key={idx} className={`flex items-center gap-2 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                        <CheckCircle2 className="text-green-500 text-sm" />
                        <span className="text-sm text-soft-black/80 font-lato-light">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Icon Circle */}
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-medium to-purple-intense rounded-full flex items-center justify-center shadow-2xl border-4 border-white z-10 relative">
                    <FontAwesomeIcon icon={step.icon} className="text-white text-3xl" />
                  </div>
                  
                  {/* Arrow down (only on non-last items) */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:flex absolute -bottom-20 left-1/2 -translate-x-1/2 text-purple-medium/30">
                      <ArrowDown className="text-2xl animate-bounce" />
                    </div>
                  )}
                </div>
                
                {/* Spacer for alternating layout */}
                <div className="flex-1 hidden lg:block"></div>
              </div>
            ))}
          </div>
        </div>
        
        {/* CTA */}
        <div className="mt-20 text-center">
          <button 
            onClick={() => navigate(getStartPath())}
            className="bg-gradient-to-r from-purple-medium to-purple-intense hover:from-purple-intense hover:to-purple-medium text-white font-lato-bold text-xl px-12 py-5 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300"
          >
            {user ? 'Ir al Dashboard' : 'Comenzar Mi Diagnóstico Gratis'}
          </button>
        </div>
      </div>
    </section>
  );
};

export default Solution;