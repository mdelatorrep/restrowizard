import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faQuoteLeft, faChartLine, faUsers, faUtensils, faRobot } from '@fortawesome/free-solid-svg-icons';

const Testimonials = () => {
  const testimonials = [
    {
      name: 'Carlos Valderrama',
      role: 'Dueño de "La Sazón del Abuelo"',
      avatar: 'CV',
      quote: 'El Co-Piloto de Finanzas detectó que estaba perdiendo $3,000 al mes en merma. En 3 meses, mi rentabilidad subió un 15%. La IA realmente entiende mi negocio.',
      metric: '+15%',
      metricLabel: 'rentabilidad',
      module: 'Finanzas IA',
      moduleIcon: faChartLine,
      moduleColor: 'from-green-400 to-emerald-600'
    },
    {
      name: 'Sofía Mendoza',
      role: 'Gerente de "Urbano Grill"',
      avatar: 'SM',
      quote: 'Antes perdía 2 horas diarias haciendo horarios. Ahora el módulo de Talento me da horarios optimizados en segundos. Mi equipo está más feliz y la rotación bajó 30%.',
      metric: '-30%',
      metricLabel: 'rotación',
      module: 'Talento IA',
      moduleIcon: faUsers,
      moduleColor: 'from-blue-400 to-indigo-600'
    },
    {
      name: 'Roberto Martínez',
      role: 'Chef Ejecutivo "Fusión Latina"',
      avatar: 'RM',
      quote: 'El análisis de menú me mostró que 3 platos me costaban más de lo que vendía. Los ajustamos con las recomendaciones de IA y ahora son los más rentables.',
      metric: '+40%',
      metricLabel: 'margen/plato',
      module: 'Menú IA',
      moduleIcon: faUtensils,
      moduleColor: 'from-orange-400 to-red-600'
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-off-white to-lavender-light/20">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-yellow-400/10 rounded-full px-4 py-2 mb-6">
            <FontAwesomeIcon icon={faStar} className="text-yellow-500" />
            <span className="text-sm font-lato-medium text-yellow-600">Resultados reales</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-headline text-purple-intense mb-6">
            Restaurantes que Ya{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-medium to-accent">
              Se Transformaron
            </span>
          </h2>
          
          <p className="max-w-2xl mx-auto text-lg text-soft-black font-lato-regular">
            Más de 500 restaurantes ya usan RestroWizard para tomar mejores decisiones con IA.
          </p>
        </div>
        
        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 relative overflow-hidden"
            >
              {/* Module Badge */}
              <div className={`absolute top-4 right-4 bg-gradient-to-r ${testimonial.moduleColor} text-white text-xs font-lato-bold px-3 py-1 rounded-full flex items-center gap-1`}>
                <FontAwesomeIcon icon={testimonial.moduleIcon} className="text-xs" />
                {testimonial.module}
              </div>
              
              {/* Quote Icon */}
              <FontAwesomeIcon icon={faQuoteLeft} className="text-4xl text-lavender-light mb-4" />
              
              {/* Quote */}
              <p className="text-soft-black font-lato-regular mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>
              
              {/* Metric */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6">
                <div className="text-3xl font-headline text-green-600">{testimonial.metric}</div>
                <div className="text-sm text-green-700/70 font-lato-light">{testimonial.metricLabel}</div>
              </div>
              
              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-medium to-purple-intense rounded-full flex items-center justify-center text-white font-lato-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-lato-bold text-purple-intense">{testimonial.name}</p>
                  <p className="text-sm text-dark-gray font-lato-light">{testimonial.role}</p>
                </div>
              </div>
              
              {/* Stars */}
              <div className="absolute bottom-4 right-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <FontAwesomeIcon key={i} icon={faStar} className="text-yellow-400 text-sm" />
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Trust Badge */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-4 bg-white rounded-full px-8 py-4 shadow-lg">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faRobot} className="text-purple-medium text-xl" />
              <span className="font-lato-bold text-purple-intense">RestroWizard AI</span>
            </div>
            <div className="w-px h-8 bg-gray-200"></div>
            <div className="text-sm text-soft-black/70 font-lato-light">
              Potenciado por <span className="font-lato-bold text-purple-intense">OpenAI</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;