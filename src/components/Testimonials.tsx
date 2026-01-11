import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faStar, faQuoteLeft, faChartLine, faUsers, faUtensils, 
  faPlay, faCheckCircle, faShieldAlt
} from '@fortawesome/free-solid-svg-icons';

const Testimonials = () => {
  const testimonials = [
    {
      name: 'Carlos Valderrama',
      role: 'Dueño',
      restaurant: 'La Sazón del Abuelo',
      location: 'CDMX',
      avatar: 'CV',
      quote: 'El Co-Piloto de Finanzas detectó que estaba perdiendo $3,000 al mes en merma. En 3 meses, mi rentabilidad subió un 15%. La IA realmente entiende mi negocio.',
      metric: '+15%',
      metricLabel: 'rentabilidad',
      module: 'Finanzas IA',
      moduleIcon: faChartLine,
      moduleColor: 'from-green-400 to-emerald-600',
      videoAvailable: true
    },
    {
      name: 'Sofía Mendoza',
      role: 'Gerente General',
      restaurant: 'Urbano Grill',
      location: 'Guadalajara',
      avatar: 'SM',
      quote: 'Antes perdía 2 horas diarias haciendo horarios. Ahora el módulo de Talento me da horarios optimizados en segundos. Mi equipo está más feliz y la rotación bajó 30%.',
      metric: '-30%',
      metricLabel: 'rotación',
      module: 'Talento IA',
      moduleIcon: faUsers,
      moduleColor: 'from-blue-400 to-indigo-600',
      videoAvailable: false
    },
    {
      name: 'Roberto Martínez',
      role: 'Chef Ejecutivo',
      restaurant: 'Fusión Latina',
      location: 'Monterrey',
      avatar: 'RM',
      quote: 'El análisis de menú me mostró que 3 platos me costaban más de lo que vendía. Los ajustamos con las recomendaciones de IA y ahora son los más rentables.',
      metric: '+40%',
      metricLabel: 'margen/plato',
      module: 'Menú IA',
      moduleIcon: faUtensils,
      moduleColor: 'from-orange-400 to-red-600',
      videoAvailable: true
    }
  ];

  const stats = [
    { value: '500+', label: 'Restaurantes activos' },
    { value: '4.9/5', label: 'Calificación promedio' },
    { value: '$2.3M', label: 'Ahorrado total' },
    { value: '98%', label: 'Tasa de satisfacción' }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-off-white to-lavender-light/30">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-yellow-400/20 rounded-full px-4 py-2 mb-6">
            <FontAwesomeIcon icon={faStar} className="text-yellow-500" />
            <span className="text-sm font-lato-medium text-yellow-700">Casos de éxito reales</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-headline text-purple-intense mb-6">
            Restaurantes que Ya{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-medium to-accent">
              Se Transformaron
            </span>
          </h2>
          
          <p className="max-w-2xl mx-auto text-lg text-soft-black/70 font-lato-regular">
            Resultados verificados de restaurantes reales usando RestroWizard
          </p>
        </div>
        
        {/* Stats Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-3xl md:text-4xl font-headline text-purple-intense">{stat.value}</p>
              <p className="text-sm text-dark-gray font-lato-light">{stat.label}</p>
            </div>
          ))}
        </div>
        
        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 relative overflow-hidden group"
            >
              {/* Module Badge */}
              <div className={`absolute top-4 right-4 bg-gradient-to-r ${testimonial.moduleColor} text-white text-xs font-lato-bold px-3 py-1.5 rounded-full flex items-center gap-1.5`}>
                <FontAwesomeIcon icon={testimonial.moduleIcon} className="text-xs" />
                {testimonial.module}
              </div>
              
              {/* Quote Icon */}
              <FontAwesomeIcon icon={faQuoteLeft} className="text-4xl text-lavender-light mb-4" />
              
              {/* Quote */}
              <p className="text-soft-black font-lato-regular mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>
              
              {/* Metric Card */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6 border border-green-100">
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-headline text-green-600">{testimonial.metric}</span>
                  <span className="text-sm text-green-700/70 font-lato-light mb-1">{testimonial.metricLabel}</span>
                </div>
              </div>
              
              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-medium to-purple-intense rounded-full flex items-center justify-center text-white font-lato-bold text-lg">
                    {testimonial.avatar}
                  </div>
                  {testimonial.videoAvailable && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                      <FontAwesomeIcon icon={faPlay} className="text-white text-xs ml-0.5" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-lato-bold text-purple-intense">{testimonial.name}</p>
                  <p className="text-sm text-dark-gray font-lato-light">{testimonial.role} • {testimonial.restaurant}</p>
                  <p className="text-xs text-dark-gray/60 font-lato-light">{testimonial.location}</p>
                </div>
              </div>
              
              {/* Stars */}
              <div className="absolute bottom-4 right-4 flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <FontAwesomeIcon key={i} icon={faStar} className="text-yellow-400 text-sm" />
                ))}
              </div>
              
              {/* Verified Badge */}
              <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1 text-green-600 text-xs">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span className="font-lato-medium">Verificado</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Trust Badges */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            {/* Logo Wall Placeholder */}
            <div className="flex items-center gap-6 opacity-60">
              <div className="text-center">
                <p className="text-sm text-dark-gray font-lato-medium mb-2">Integrado con</p>
                <div className="flex items-center gap-4">
                  <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm font-lato-bold text-gray-600">Rappi</div>
                  <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm font-lato-bold text-gray-600">Uber Eats</div>
                  <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm font-lato-bold text-gray-600">DiDi Food</div>
                </div>
              </div>
            </div>
            
            <div className="w-px h-16 bg-gray-200 hidden md:block"></div>
            
            {/* Security Badge */}
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faShieldAlt} className="text-3xl text-green-500" />
              <div>
                <p className="font-lato-bold text-purple-intense">Datos seguros</p>
                <p className="text-sm text-dark-gray font-lato-light">Encriptación de nivel bancario</p>
              </div>
            </div>
            
            <div className="w-px h-16 bg-gray-200 hidden md:block"></div>
            
            {/* AI Badge */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-medium to-purple-intense rounded-xl flex items-center justify-center">
                <span className="text-white font-lato-bold text-sm">AI</span>
              </div>
              <div>
                <p className="font-lato-bold text-purple-intense">Potenciado por</p>
                <p className="text-sm text-dark-gray font-lato-light">Inteligencia Artificial avanzada</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
