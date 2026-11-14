import { useNavigate } from 'react-router-dom';
import restrowizardLogo from '@/assets/logos/restrowizard.png';
import { FEATURES } from '@/config/features';

const Footer = () => {
  const navigate = useNavigate();

  const handleNav = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (path.startsWith('#')) {
      // Scroll to section on homepage
      if (window.location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          document.getElementById(path.slice(1))?.scrollIntoView({ behavior: 'smooth' });
        }, 200);
      } else {
        document.getElementById(path.slice(1))?.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(path);
    }
  };

  return (
    <footer className="bg-soft-black text-white/50">
      <div className="container mx-auto px-6 py-16">
        <div className={`grid ${FEATURES.ecosystem ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-10 mb-12`}>
          {/* Brand */}
          <div className="md:col-span-1">
            <img src={restrowizardLogo} alt="RestroWizard" className="h-9 w-auto mb-4 brightness-0 invert" />
            <p className="font-lato-light text-sm leading-relaxed">
              Finanzas, operación y presencia digital con IA para restaurantes y bares.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-headline text-white/80 text-sm mb-4">Producto</h4>
            <ul className="space-y-2 text-sm font-lato-light">
              <li><a href="#producto" onClick={handleNav('#producto')} className="hover:text-white transition-colors">Plataforma</a></li>
              <li><a href="/demo" onClick={handleNav('/demo')} className="hover:text-white transition-colors">Demo en vivo</a></li>
              <li><a href="/diagnosis" onClick={handleNav('/diagnosis')} className="hover:text-white transition-colors">Diagnóstico Gratis</a></li>
            </ul>
          </div>

          {FEATURES.ecosystem && (
          <div>
            <h4 className="font-headline text-white/80 text-sm mb-4">Ecosistema</h4>
            <ul className="space-y-2 text-sm font-lato-light">
              <li><a href="/jobs" onClick={handleNav('/jobs')} className="hover:text-white transition-colors">RestroJobs</a></li>
              <li><a href="/learn" onClick={handleNav('/learn')} className="hover:text-white transition-colors">RestroLearn</a></li>
              <li><a href="/services" onClick={handleNav('/services')} className="hover:text-white transition-colors">RestroServices</a></li>
              <li><a href="/growth" onClick={handleNav('/growth')} className="hover:text-white transition-colors">RestroGrowth</a></li>
            </ul>
          </div>
          )}

          <div>
            <h4 className="font-headline text-white/80 text-sm mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm font-lato-light">
              <li><a href="/about" onClick={handleNav('/about')} className="hover:text-white transition-colors">Sobre nosotros</a></li>
              <li><a href="/contact" onClick={handleNav('/contact')} className="hover:text-white transition-colors">Contacto</a></li>
              <li><a href="/privacy" onClick={handleNav('/privacy')} className="hover:text-white transition-colors">Privacidad</a></li>
              <li><a href="/terms" onClick={handleNav('/terms')} className="hover:text-white transition-colors">Términos</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm font-lato-light">© {new Date().getFullYear()} RestroWizard. Todos los derechos reservados.</p>
          {/* Redes sociales: se muestran cuando existan las cuentas reales (antes apuntaban a "#"). */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
