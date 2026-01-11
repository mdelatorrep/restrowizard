import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLinkedin, faInstagram, faFacebook, faTwitter, faYoutube } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope, faShieldAlt, faLock, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-soft-black text-off-white/70">
      {/* Newsletter Section */}
      <div className="border-b border-dark-gray/50">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-headline text-white mb-3">
              📊 Descarga Gratis: 10 KPIs que Todo Restaurante Debe Medir
            </h3>
            <p className="text-off-white/60 font-lato-light mb-6">
              Únete a +5,000 restauranteros que reciben tips de rentabilidad cada semana
            </p>
            
            {subscribed ? (
              <div className="flex items-center justify-center gap-2 text-green-400">
                <FontAwesomeIcon icon={faCheckCircle} />
                <span className="font-lato-medium">¡Listo! Revisa tu correo para descargar la guía</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-purple-medium"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-medium to-purple-intense text-white font-lato-bold rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  Descargar Gratis
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="md:col-span-2">
            <img 
              src="/lovable-uploads/4c50cd38-4342-44bc-9a98-cc6a1eba63f4.png" 
              alt="RestroWizard" 
              className="h-10 w-auto mb-4 brightness-0 invert opacity-80"
            />
            <p className="text-off-white/60 font-lato-light mb-6 max-w-sm">
              Tu Co-Piloto de IA para la rentabilidad de tu restaurante. 
              7 módulos inteligentes que trabajan 24/7 para optimizar tu negocio.
            </p>
            
            {/* Social Icons */}
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-purple-medium transition-colors">
                <FontAwesomeIcon icon={faLinkedin} />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-purple-medium transition-colors">
                <FontAwesomeIcon icon={faInstagram} />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-purple-medium transition-colors">
                <FontAwesomeIcon icon={faFacebook} />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-purple-medium transition-colors">
                <FontAwesomeIcon icon={faYoutube} />
              </a>
            </div>
          </div>
          
          {/* Links Columns */}
          <div>
            <h4 className="font-headline text-white mb-4">Producto</h4>
            <ul className="space-y-2">
              <li><a href="#" className="font-lato-light hover:text-white transition-colors">Finanzas IA</a></li>
              <li><a href="#" className="font-lato-light hover:text-white transition-colors">Talento IA</a></li>
              <li><a href="#" className="font-lato-light hover:text-white transition-colors">Operaciones IA</a></li>
              <li><a href="#" className="font-lato-light hover:text-white transition-colors">Menú IA</a></li>
              <li><a href="#" className="font-lato-light hover:text-white transition-colors">Ghost Kitchen</a></li>
              <li><a href="#" className="font-lato-light hover:text-white transition-colors">Sostenibilidad</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-headline text-white mb-4">Recursos</h4>
            <ul className="space-y-2">
              <li><a href="#" className="font-lato-light hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="font-lato-light hover:text-white transition-colors">Casos de Éxito</a></li>
              <li><a href="#" className="font-lato-light hover:text-white transition-colors">Centro de Ayuda</a></li>
              <li><a href="#" className="font-lato-light hover:text-white transition-colors">API Docs</a></li>
              <li><a href="#" className="font-lato-light hover:text-white transition-colors">Webinars</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-headline text-white mb-4">Empresa</h4>
            <ul className="space-y-2">
              <li><a href="#" className="font-lato-light hover:text-white transition-colors">Sobre Nosotros</a></li>
              <li><a href="#" className="font-lato-light hover:text-white transition-colors">Carreras</a></li>
              <li><a href="#" className="font-lato-light hover:text-white transition-colors">Prensa</a></li>
              <li><a href="#" className="font-lato-light hover:text-white transition-colors">Contacto</a></li>
              <li><a href="#" className="font-lato-light hover:text-white transition-colors">Partners</a></li>
            </ul>
          </div>
        </div>
        
        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-6 py-8 border-y border-dark-gray/50 mb-8">
          <div className="flex items-center gap-2 text-off-white/50">
            <FontAwesomeIcon icon={faShieldAlt} className="text-green-400" />
            <span className="text-sm font-lato-light">SSL Seguro</span>
          </div>
          <div className="flex items-center gap-2 text-off-white/50">
            <FontAwesomeIcon icon={faLock} className="text-green-400" />
            <span className="text-sm font-lato-light">Datos Encriptados</span>
          </div>
          <div className="flex items-center gap-2 text-off-white/50">
            <span className="text-sm font-lato-light">SOC 2 Compliant</span>
          </div>
          <div className="flex items-center gap-2 text-off-white/50">
            <span className="text-sm font-lato-light">GDPR Ready</span>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center text-sm">
          <p className="font-lato-light mb-4 md:mb-0">
            &copy; 2025 RestroWizard. Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            <a href="#" className="font-lato-light hover:text-white transition-colors">Política de Privacidad</a>
            <a href="#" className="font-lato-light hover:text-white transition-colors">Términos de Servicio</a>
            <a href="#" className="font-lato-light hover:text-white transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
