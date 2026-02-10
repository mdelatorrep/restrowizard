import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faCalendarCheck, faChartLine } from '@fortawesome/free-solid-svg-icons';
import { faRobot } from '@fortawesome/free-solid-svg-icons';

const features = [
  {
    icon: faGlobe,
    title: 'Sitio web profesional',
    description: 'Publica tu restaurante con dominio propio, menú digital y pedidos online en minutos.',
  },
  {
    icon: faCalendarCheck,
    title: 'Reservas y delivery',
    description: 'Tus clientes reservan mesa o piden a domicilio directo desde tu sitio. Sin comisiones.',
  },
  {
    icon: faChartLine,
    title: 'Inteligencia artificial',
    description: 'Finanzas, inventario, talento y operaciones optimizados por IA que aprende de tu negocio.',
  },
];

const ProductShowcase = () => {
  return (
    <section className="py-32 bg-white">
      <div className="container mx-auto px-6">
        {/* Section headline */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-headline text-purple-intense leading-tight mb-6">
            Todo lo que necesitas.
            <br />
            <span className="text-purple-medium">Nada que te sobre.</span>
          </h2>
          <p className="text-lg md:text-xl font-lato-light text-dark-gray">
            Una plataforma diseñada para que te enfoques en lo que importa: tu cocina.
          </p>
        </div>

        {/* Dashboard mockup */}
        <div className="max-w-4xl mx-auto mb-24">
          <div className="bg-gradient-to-br from-purple-intense to-purple-medium rounded-3xl p-1 shadow-2xl shadow-purple-intense/20">
            <div className="bg-gradient-to-br from-purple-intense/90 to-purple-medium/80 backdrop-blur rounded-[calc(1.5rem-4px)] p-6 md:p-10">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-white/20" />
                  <div className="w-3 h-3 rounded-full bg-white/20" />
                  <div className="w-3 h-3 rounded-full bg-white/20" />
                </div>
                <div className="flex-1 bg-white/10 rounded-lg px-4 py-1.5 text-white/40 text-sm font-mono ml-3">
                  turestaurante.restrowizard.app
                </div>
              </div>

              {/* Simplified dashboard content */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
                  <p className="text-white/50 text-xs mb-1 font-lato-regular">Reservas hoy</p>
                  <p className="text-3xl font-headline text-white">24</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
                  <p className="text-white/50 text-xs mb-1 font-lato-regular">Pedidos web</p>
                  <p className="text-3xl font-headline text-white">47</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
                  <p className="text-white/50 text-xs mb-1 font-lato-regular">Rentabilidad</p>
                  <p className="text-3xl font-headline text-white">18.5%</p>
                </div>
              </div>

              {/* AI alert */}
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10 flex items-center gap-4">
                <div className="w-10 h-10 bg-lavender-light/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FontAwesomeIcon icon={faRobot} className="text-lavender-light" />
                </div>
                <p className="text-white/70 text-sm font-lato-regular">
                  Tienes 3 reservas para las 8pm pero solo 2 meseros. ¿Quieres que contacte a María?
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Three features */}
        <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
          {features.map((feature, i) => (
            <div key={i} className="text-center">
              <div className="w-14 h-14 bg-purple-intense/5 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <FontAwesomeIcon icon={feature.icon} className="text-purple-intense text-xl" />
              </div>
              <h3 className="text-xl font-headline text-purple-intense mb-3">{feature.title}</h3>
              <p className="text-dark-gray font-lato-light leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;
