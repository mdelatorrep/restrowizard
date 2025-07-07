import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLinkedin, faInstagram, faFacebook } from '@fortawesome/free-brands-svg-icons';

const Footer = () => {
  return (
    <footer className="bg-soft-black text-off-white/70 pt-16 pb-8">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-headline text-lg mb-4 text-white">RestroWizard</h4>
            <ul>
              <li className="mb-2">
                <a href="#" className="font-lato-regular hover:text-white transition-colors">Sobre Nosotros</a>
              </li>
              <li className="mb-2">
                <a href="#" className="font-lato-regular hover:text-white transition-colors">Prensa</a>
              </li>
              <li className="mb-2">
                <a href="#" className="font-lato-regular hover:text-white transition-colors">Carreras</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-headline text-lg mb-4 text-white">Ecosistema</h4>
            <ul>
              <li className="mb-2">
                <a href="#" className="font-lato-regular hover:text-white transition-colors">RestroTalent</a>
              </li>
              <li className="mb-2">
                <a href="#" className="font-lato-regular hover:text-white transition-colors">RestroLearn</a>
              </li>
              <li className="mb-2">
                <a href="#" className="font-lato-regular hover:text-white transition-colors">RestroServices</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-headline text-lg mb-4 text-white">Recursos</h4>
            <ul>
              <li className="mb-2">
                <a href="#" className="font-lato-regular hover:text-white transition-colors">Blog</a>
              </li>
              <li className="mb-2">
                <a href="#" className="font-lato-regular hover:text-white transition-colors">Casos de Éxito</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-headline text-lg mb-4 text-white">Legal</h4>
            <ul>
              <li className="mb-2">
                <a href="#" className="font-lato-regular hover:text-white transition-colors">Política de Privacidad</a>
              </li>
              <li className="mb-2">
                <a href="#" className="font-lato-regular hover:text-white transition-colors">Términos de Servicio</a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-dark-gray/50 pt-8 flex flex-col md:flex-row justify-between items-center text-center">
          <p className="text-sm mb-4 md:mb-0 font-lato-regular">
            &copy; 2025 RestroWizard. Todos los derechos reservados.
          </p>
          <div className="flex space-x-4">
            <a href="#" className="text-lavender-light hover:text-white transition-colors text-2xl">
              <FontAwesomeIcon icon={faLinkedin} />
            </a>
            <a href="#" className="text-lavender-light hover:text-white transition-colors text-2xl">
              <FontAwesomeIcon icon={faInstagram} />
            </a>
            <a href="#" className="text-lavender-light hover:text-white transition-colors text-2xl">
              <FontAwesomeIcon icon={faFacebook} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;