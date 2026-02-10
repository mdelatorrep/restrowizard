import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuoteLeft } from '@fortawesome/free-solid-svg-icons';

const testimonials = [
  {
    name: 'Carlos Valderrama',
    role: 'Dueño · La Sazón del Abuelo, CDMX',
    quote: 'El Co-Piloto de Finanzas detectó que estaba perdiendo $3,000 al mes en merma. En 3 meses, mi rentabilidad subió un 15%.',
  },
  {
    name: 'Sofía Mendoza',
    role: 'Gerente General · Urbano Grill, Guadalajara',
    quote: 'Antes perdía 2 horas diarias haciendo horarios. Ahora el módulo de Talento me da horarios optimizados en segundos.',
  },
  {
    name: 'Roberto Martínez',
    role: 'Chef Ejecutivo · Fusión Latina, Monterrey',
    quote: 'El análisis de menú me mostró que 3 platos me costaban más de lo que vendía. Los ajustamos y ahora son los más rentables.',
  },
];

const Testimonials = () => {
  return (
    <section id="testimonios" className="py-32 bg-off-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-headline text-purple-intense leading-tight">
            Lo que dicen nuestros clientes.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <div key={i} className="space-y-6">
              <FontAwesomeIcon icon={faQuoteLeft} className="text-2xl text-lavender-light" />
              <p className="text-purple-intense font-lato-regular text-lg leading-relaxed">
                "{t.quote}"
              </p>
              <div>
                <p className="font-headline text-purple-intense text-sm">{t.name}</p>
                <p className="text-dark-gray font-lato-light text-sm">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
