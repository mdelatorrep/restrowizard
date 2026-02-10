import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLinkedin, faInstagram, faFacebook, faYoutube } from '@fortawesome/free-brands-svg-icons';
import restrowizardLogo from '@/assets/logos/restrowizard.png';

const Footer = () => {
  return (
    <footer className="bg-soft-black text-white/50">
      <div className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <img src={restrowizardLogo} alt="RestroWizard" className="h-9 w-auto mb-4 brightness-0 invert opacity-80" />
            <p className="font-lato-light text-sm leading-relaxed">
              La plataforma integral con IA para la industria gastronómica.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-headline text-white/80 text-sm mb-4">Producto</h4>
            <ul className="space-y-2 text-sm font-lato-light">
              <li><a href="#" className="hover:text-white transition-colors">Sitio Web</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Reservas</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Delivery</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Módulos IA</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-headline text-white/80 text-sm mb-4">Ecosistema</h4>
            <ul className="space-y-2 text-sm font-lato-light">
              <li><a href="/jobs" className="hover:text-white transition-colors">RestroJobs</a></li>
              <li><a href="/learn" className="hover:text-white transition-colors">RestroLearn</a></li>
              <li><a href="/services" className="hover:text-white transition-colors">RestroServices</a></li>
              <li><a href="/growth" className="hover:text-white transition-colors">RestroGrowth</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-headline text-white/80 text-sm mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm font-lato-light">
              <li><a href="#" className="hover:text-white transition-colors">Sobre nosotros</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacidad</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Términos</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm font-lato-light">© 2025 RestroWizard. Todos los derechos reservados.</p>
          <div className="flex gap-3">
            {[faLinkedin, faInstagram, faFacebook, faYoutube].map((icon, i) => (
              <a key={i} href="#" className="w-9 h-9 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                <FontAwesomeIcon icon={icon} className="text-sm" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
