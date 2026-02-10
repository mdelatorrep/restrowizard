import React from 'react';
import { useNavigate } from 'react-router-dom';
import restrowizardLogo from '@/assets/logos/restrowizard.png';
import restrojobsLogo from '@/assets/logos/restrojobs.png';
import restrogrowthLogo from '@/assets/logos/restrogrowth.png';
import restrolearnLogo from '@/assets/logos/restrolearn.png';
import restroservicesLogo from '@/assets/logos/restroservices.png';

const solutions = [
  {
    logo: restrowizardLogo,
    name: 'RestroWizard',
    description: 'Plataforma de gestión integral con IA para restaurantes. 7 co-pilotos inteligentes que optimizan tu negocio 24/7.',
    tags: ['IA', 'Gestión', 'Finanzas', 'Operaciones'],
    active: true,
    action: '/auth',
  },
  {
    logo: restrojobsLogo,
    name: 'RestroJobs',
    description: 'Bolsa de empleo especializada en la industria gastronómica. Conecta talento con oportunidades.',
    tags: ['Empleo', 'Talento', 'Reclutamiento'],
    active: true,
    action: '/jobs',
  },
  {
    logo: restrolearnLogo,
    name: 'RestroLearn',
    description: 'Plataforma de formación y capacitación continua para equipos de restaurantes y profesionales gastronómicos.',
    tags: ['Formación', 'Cursos', 'Certificaciones'],
    active: true,
    action: '/events',
  },
  {
    logo: restroservicesLogo,
    name: 'RestroServices',
    description: 'Directorio de proveedores y servicios especializados para la industria restaurantera.',
    tags: ['Proveedores', 'Servicios', 'Equipamiento'],
    active: true,
    action: '#',
  },
  {
    logo: restrogrowthLogo,
    name: 'RestroGrowth',
    description: 'Plataforma de emprendimiento para conectar inversionistas y restauranteros para la creación de nuevos negocios culinarios.',
    tags: ['Inversión', 'Emprendimiento', 'Expansión'],
    active: false,
    action: null,
  },
];

const SolutionsShowcase = () => {
  const navigate = useNavigate();

  return (
    <section id="soluciones" className="py-24 bg-gradient-to-b from-off-white to-lavender-light/30">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-medium/10 rounded-full px-4 py-2 mb-6">
            <span className="text-sm font-lato-medium text-purple-medium">Ecosistema de Soluciones</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-headline text-purple-intense mb-6">
            Una Familia de Productos para la{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-medium to-accent">
              Industria Gastronómica
            </span>
          </h2>
          <p className="max-w-3xl mx-auto text-lg text-soft-black font-lato-regular">
            Soluciones especializadas que cubren cada aspecto del negocio gastronómico,
            desde la operación diaria hasta la inversión y el crecimiento.
          </p>
        </div>

        {/* Solutions Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {solutions.map((solution) => (
            <div
              key={solution.name}
              className={`group relative bg-white rounded-2xl p-6 border-2 transition-all duration-300 ${
                solution.active
                  ? 'border-transparent shadow-lg hover:shadow-xl hover:-translate-y-1 cursor-pointer'
                  : 'border-dashed border-purple-medium/30 opacity-75'
              }`}
              onClick={() => {
                if (solution.active && solution.action) {
                  if (solution.action.startsWith('#')) return;
                  navigate(solution.action);
                }
              }}
            >
              {!solution.active && (
                <div className="absolute top-4 right-4">
                  <span className="bg-purple-medium/10 text-purple-medium text-xs font-lato-bold px-3 py-1 rounded-full">
                    Próximamente
                  </span>
                </div>
              )}

              <div className="mb-4">
                <img
                  src={solution.logo}
                  alt={solution.name}
                  className="h-12 w-auto object-contain"
                />
              </div>

              <p className="text-soft-black/80 font-lato-regular text-sm mb-4 leading-relaxed">
                {solution.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {solution.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-lavender-light/50 text-purple-intense text-xs font-lato-medium px-2.5 py-1 rounded-lg"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SolutionsShowcase;
