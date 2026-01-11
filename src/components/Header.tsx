import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes, faStar, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    if (window.location.pathname !== '/') {
      navigate('/', { replace: true });
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsMenuOpen(false);
  };

  const navLinks = [
    { label: 'Producto', action: () => scrollToSection('ecosistema') },
    { label: 'Consultores', action: () => scrollToSection('consultores') },
    { label: 'Casos de Éxito', action: () => scrollToSection('testimonios') },
    { label: 'Eventos', action: () => navigate('/events') },
    { label: 'Jobs', action: () => navigate('/jobs') },
  ];

  return (
    <header 
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg py-2' 
          : 'bg-transparent py-4'
      }`}
    >
      <nav className="container mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <div 
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <img 
            src="/lovable-uploads/4c50cd38-4342-44bc-9a98-cc6a1eba63f4.png" 
            alt="RestroWizard" 
            className="h-10 md:h-12 w-auto"
          />
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-6">
          {navLinks.map((link, index) => (
            <button 
              key={index}
              onClick={link.action}
              className={`font-lato-medium transition-colors ${
                isScrolled 
                  ? 'text-dark-gray hover:text-purple-medium' 
                  : 'text-white/90 hover:text-white'
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center space-x-3">
          {user ? (
            <>
              <Button
                variant="ghost"
                onClick={() => navigate('/diagnosis')}
                className={`font-lato-medium ${
                  isScrolled ? 'text-purple-medium hover:bg-purple-medium/10' : 'text-white hover:bg-white/10'
                }`}
              >
                Dashboard
              </Button>
              <Button 
                onClick={signOut}
                variant="outline"
                className={`font-lato-bold ${
                  isScrolled 
                    ? 'border-purple-medium text-purple-medium hover:bg-purple-medium hover:text-white' 
                    : 'border-white text-white hover:bg-white hover:text-purple-intense'
                }`}
              >
                Cerrar Sesión
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="ghost"
                onClick={() => navigate('/auth')}
                className={`font-lato-medium ${
                  isScrolled ? 'text-purple-medium hover:bg-purple-medium/10' : 'text-white hover:bg-white/10'
                }`}
              >
                Iniciar Sesión
              </Button>
              <Button 
                onClick={() => navigate('/auth')}
                className={`font-lato-bold group ${
                  isScrolled 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg' 
                    : 'bg-white text-purple-intense hover:bg-white/90'
                }`}
              >
                Comenzar Gratis
                <FontAwesomeIcon icon={faArrowRight} className="ml-2 text-sm group-hover:translate-x-1 transition-transform" />
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`lg:hidden focus:outline-none ${isScrolled ? 'text-purple-intense' : 'text-white'}`}
        >
          <FontAwesomeIcon icon={isMenuOpen ? faTimes : faBars} size="xl" />
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t shadow-xl">
          <div className="container mx-auto px-6 py-4 space-y-2">
            {navLinks.map((link, index) => (
              <button 
                key={index}
                onClick={link.action}
                className="block w-full text-left py-3 px-4 text-dark-gray font-lato-medium hover:bg-lavender-light/30 rounded-lg transition-colors"
              >
                {link.label}
              </button>
            ))}
            
            <div className="pt-4 border-t border-gray-100 space-y-2">
              {user ? (
                <>
                  <button 
                    onClick={() => {
                      navigate('/diagnosis');
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-center px-4 py-3 rounded-lg border-2 border-purple-medium text-purple-medium font-lato-bold hover:bg-purple-medium hover:text-white transition-all"
                  >
                    Dashboard
                  </button>
                  <button 
                    onClick={() => {
                      signOut();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-center px-4 py-3 rounded-lg bg-purple-intense text-white font-lato-bold hover:opacity-90 transition-all"
                  >
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => {
                      navigate('/auth');
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-center px-4 py-3 rounded-lg border-2 border-purple-medium text-purple-medium font-lato-bold hover:bg-purple-medium hover:text-white transition-all"
                  >
                    Iniciar Sesión
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/auth');
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-center px-4 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-lato-bold hover:opacity-90 transition-all"
                  >
                    Comenzar Gratis
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
