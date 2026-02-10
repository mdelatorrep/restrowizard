import restrowizardLogo from '@/assets/logos/restrowizard-icon.png';
import restrojobsLogo from '@/assets/logos/restrojobs.png';
import restrolearnLogo from '@/assets/logos/restrolearn.png';
import restroservicesLogo from '@/assets/logos/restroservices.png';
import restrogrowthLogo from '@/assets/logos/restrogrowth.png';

const solutions = [
  { logo: restrowizardLogo, name: 'RestroWizard', desc: 'Gestión operativa con IA' },
  { logo: restrojobsLogo, name: 'RestroJobs', desc: 'Bolsa de empleo gastronómica' },
  { logo: restrolearnLogo, name: 'RestroLearn', desc: 'Formación y capacitación' },
  { logo: restroservicesLogo, name: 'RestroServices', desc: 'Proveedores y servicios' },
  { logo: restrogrowthLogo, name: 'RestroGrowth', desc: 'Inversión y emprendimiento' },
];

const EcosystemMinimal = () => {
  return (
    <section id="ecosistema" className="py-32 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-headline text-purple-intense leading-tight mb-6">
            Un ecosistema completo.
          </h2>
          <p className="text-lg md:text-xl font-lato-light text-dark-gray">
            Cinco soluciones integradas para toda la industria gastronómica.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 max-w-5xl mx-auto">
          {solutions.map((solution, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center group"
            >
              <div className="w-20 h-20 bg-purple-intense/5 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-purple-intense/10 transition-colors duration-300">
                <img
                  src={solution.logo}
                  alt={solution.name}
                  className="h-12 w-auto"
                />
              </div>
              <h3 className="font-headline text-purple-intense text-sm mb-1">{solution.name}</h3>
              <p className="text-dark-gray/70 font-lato-light text-xs leading-snug">{solution.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EcosystemMinimal;
