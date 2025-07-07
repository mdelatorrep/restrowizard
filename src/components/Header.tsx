import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import restroWizardLogo from '../assets/restrowizard-logo.png';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header 
      className={`bg-off-white/80 backdrop-blur-sm shadow-md w-full fixed top-0 z-50 transition-smooth ${
        isScrolled ? 'py-1' : 'py-3'
      }`}
    >
      <nav className="container mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <img 
            src={restroWizardLogo} 
            alt="RestroWizard" 
            className="h-8 w-8"
          />
          <div className="text-2xl font-headline font-bold text-purple-intense">
            RestroWizard
          </div>
        </div>
        
        <div className="hidden lg:flex items-center space-x-6">
          <button 
            onClick={() => scrollToSection('solucion')} 
            className="hover:text-purple-medium transition-colors"
          >
            Diagnóstico
          </button>
          <button 
            onClick={() => scrollToSection('ecosistema')} 
            className="hover:text-purple-medium transition-colors"
          >
            Ecosistema
          </button>
          <a href="#" className="hover:text-purple-medium transition-colors">Precios</a>
          <a href="#" className="hover:text-purple-medium transition-colors">Blog</a>
          <a href="#" className="hover:text-purple-medium transition-colors">Contacto</a>
        </div>

        <div className="hidden lg:flex items-center space-x-4">
          <a 
            href="#" 
            className="px-4 py-2 rounded-lg border-2 border-purple-medium text-purple-medium font-bold hover:bg-purple-medium hover:text-off-white transition-smooth"
          >
            Iniciar Sesión
          </a>
          <button 
            onClick={() => scrollToSection('cta-final')}
            className="px-4 py-2 rounded-lg bg-purple-intense text-off-white font-bold hover:opacity-90 shadow-lg transform hover:scale-105 transition-smooth"
          >
            Iniciar Diagnóstico Gratis
          </button>
        </div>

        <div className="lg:hidden">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-purple-intense focus:outline-none"
          >
            <FontAwesomeIcon icon={isMenuOpen ? faTimes : faBars} size="2x" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-off-white border-t border-lavender-light">
          <button 
            onClick={() => {
              scrollToSection('solucion');
              setIsMenuOpen(false);
            }} 
            className="block w-full text-left py-2 px-4 text-sm hover:bg-lavender-light"
          >
            Diagnóstico
          </button>
          <button 
            onClick={() => {
              scrollToSection('ecosistema');
              setIsMenuOpen(false);
            }} 
            className="block w-full text-left py-2 px-4 text-sm hover:bg-lavender-light"
          >
            Ecosistema
          </button>
          <a href="#" className="block py-2 px-4 text-sm hover:bg-lavender-light">Precios</a>
          <a href="#" className="block py-2 px-4 text-sm hover:bg-lavender-light">Blog</a>
          <a href="#" className="block py-2 px-4 text-sm hover:bg-lavender-light">Contacto</a>
          
          <div className="p-4 border-t border-lavender-light space-y-2">
            <a 
              href="#" 
              className="block w-full text-center px-4 py-2 rounded-lg border-2 border-purple-medium text-purple-medium font-bold hover:bg-purple-medium hover:text-off-white transition-smooth"
            >
              Iniciar Sesión
            </a>
            <button 
              onClick={() => {
                scrollToSection('cta-final');
                setIsMenuOpen(false);
              }}
              className="block w-full text-center px-4 py-2 rounded-lg bg-purple-intense text-off-white font-bold hover:opacity-90 transition-smooth"
            >
              Iniciar Diagnóstico Gratis
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;