import { Bot, Boxes, DollarSign, Globe, Users } from 'lucide-react';
const painPoints = [
  {
    icon: faDollarSign,
    title: 'Control Financiero',
    stat: 'El 38% de restaurantes no es rentable',
    solution: 'Prime Cost en tiempo real, Estado de Resultados (P&L) automatizado y alertas cuando tus costos se desbordan.',
  },
  {
    icon: faUsers,
    title: 'Gestión de Talento',
    stat: 'El 45% no encuentra personal calificado',
    solution: 'Turnos inteligentes, control de ausencias, programas de formación y beneficios que reducen la rotación.',
  },
  {
    icon: faBoxesStacked,
    title: 'Inventario y Proveedores',
    stat: '30% de merma descontrolada',
    solution: 'Inventario con recetas vinculadas, deducción automática por venta y análisis de proveedores con IA.',
  },
  {
    icon: faGlobe,
    title: 'Presencia Digital',
    stat: 'El 60% no tiene sitio web',
    solution: 'Sitio web, menú digital, reservas y delivery sin comisiones, listo en minutos.',
  },
  {
    icon: faRobot,
    title: 'Copiloto IA',
    stat: 'Decisiones basadas en intuición',
    solution: 'Un copiloto que analiza tu operación y te dice qué hacer antes de que sea tarde.',
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

              {/* Financial dashboard metrics */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
                  <p className="text-white/50 text-xs mb-1 font-lato-regular">Prime Cost</p>
                  <p className="text-3xl font-headline text-white">58.2%</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
                  <p className="text-white/50 text-xs mb-1 font-lato-regular">Costo laboral</p>
                  <p className="text-3xl font-headline text-white">22.1%</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
                  <p className="text-white/50 text-xs mb-1 font-lato-regular">Staff activo hoy</p>
                  <p className="text-3xl font-headline text-white">12/14</p>
                </div>
              </div>

              {/* AI alert - financial focus */}
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10 flex items-center gap-4">
                <div className="w-10 h-10 bg-lavender-light/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bot className="text-lavender-light" />
                </div>
                <p className="text-white/70 text-sm font-lato-regular">
                  Tu Prime Cost subió 3.2% esta semana. El costo de proteínas aumentó un 15%. Te sugiero renegociar con tu proveedor.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Five pain-point blocks */}
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-8 max-w-6xl mx-auto">
          {painPoints.map((point, i) => (
            <div key={i} className="text-center">
              <div className="w-14 h-14 bg-purple-intense/5 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <FontAwesomeIcon icon={point.icon} className="text-purple-intense text-xl" />
              </div>
              <h3 className="text-lg font-headline text-purple-intense mb-2">{point.title}</h3>
              <p className="text-purple-medium text-sm font-lato-regular mb-3">{point.stat}</p>
              <p className="text-dark-gray font-lato-light text-sm leading-relaxed">{point.solution}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;
