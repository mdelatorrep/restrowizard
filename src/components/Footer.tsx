import { useNavigate } from 'react-router-dom';
import restrowizardLogo from '@/assets/logos/restrowizard.png';
import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';

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
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <img src={restrowizardLogo} alt="RestroWizard" className="h-9 w-auto mb-4 brightness-0 invert" />
            <p className="font-lato-light text-sm leading-relaxed">
              La plataforma integral con IA para la industria gastronómica.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-headline text-white/80 text-sm mb-4">Producto</h4>
            <ul className="space-y-2 text-sm font-lato-light">
              <li><a href="#ecosistema" onClick={handleNav('#ecosistema')} className="hover:text-white transition-colors">Plataforma</a></li>
              <li><a href="#soluciones" onClick={handleNav('#soluciones')} className="hover:text-white transition-colors">Soluciones</a></li>
              <li><a href="#consultores" onClick={handleNav('#consultores')} className="hover:text-white transition-colors">Consultores</a></li>
              <li><a href="/diagnosis" onClick={handleNav('/diagnosis')} className="hover:text-white transition-colors">Diagnóstico Gratis</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-headline text-white/80 text-sm mb-4">Ecosistema</h4>
            <ul className="space-y-2 text-sm font-lato-light">
              <li><a href="/jobs" onClick={handleNav('/jobs')} className="hover:text-white transition-colors">RestroJobs</a></li>
              <li><a href="/learn" onClick={handleNav('/learn')} className="hover:text-white transition-colors">RestroLearn</a></li>
              <li><a href="/services" onClick={handleNav('/services')} className="hover:text-white transition-colors">RestroServices</a></li>
              <li><a href="/growth" onClick={handleNav('/growth')} className="hover:text-white transition-colors">RestroGrowth</a></li>
            </ul>
          </div>

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
          <div className="flex gap-3">
            {[Linkedin, Instagram, Facebook, Youtube].map((Icon, i) => (
            <a key={i} href="#" className="w-9 h-9 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
              <Icon className="text-sm" />
            </a>
          ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
