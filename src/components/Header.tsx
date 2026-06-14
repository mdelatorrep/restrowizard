import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserType } from '@/hooks/useUserType';
import restrowizardLogo from '@/assets/logos/restrowizard.png';
import restrojobsLogo from '@/assets/logos/restrojobs.png';
import restrogrowthLogo from '@/assets/logos/restrogrowth.png';
import restrolearnLogo from '@/assets/logos/restrolearn.png';
import restroservicesLogo from '@/assets/logos/restroservices.png';
import { ArrowRight, ChevronDown, Menu, Star, X } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSolutions, setShowSolutions] = useState(false);
  const solutionsRef = useRef<HTMLDivElement>(null);
  const solutionsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { userType } = useUserType();

  // Determine the correct dashboard path based on user type
  const getDashboardPath = () => {
    if (userType === 'consultant') return '/c/dashboard';
    if (userType === 'restaurant_owner') return '/r/dashboard';
    return '/onboarding'; // Fallback if no type yet
  };

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

  const solutionItems = [
    { logo: restrowizardLogo, name: 'RestroWizard', desc: 'Gestión integral con IA', action: () => scrollToSection('ecosistema') },
    { logo: restrojobsLogo, name: 'RestroJobs', desc: 'Bolsa de empleo gastronómica', action: () => navigate('/jobs') },
    { logo: restrolearnLogo, name: 'RestroLearn', desc: 'Formación y capacitación', action: () => navigate('/learn') },
    { logo: restroservicesLogo, name: 'RestroServices', desc: 'Proveedores y servicios', action: () => navigate('/services') },
    { logo: restrogrowthLogo, name: 'RestroGrowth', desc: 'Inversión y emprendimiento', action: () => navigate('/growth') },
  ];

  const navLinks = [
    { label: 'Soluciones', action: () => scrollToSection('soluciones'), isSolutions: true },
    { label: 'Producto', action: () => scrollToSection('ecosistema') },
    { label: 'Consultores', action: () => scrollToSection('consultores') },
    { label: 'Testimonios', action: () => scrollToSection('testimonios') },
    { label: 'Eventos', action: () => navigate('/events') },
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
            src={restrowizardLogo}
            alt="RestroWizard" 
            className="h-10 md:h-12 w-auto"
          />
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-6">
          {navLinks.map((link, index) => (
            'isSolutions' in link && link.isSolutions ? (
              <div
                key={index}
                className="relative"
                ref={solutionsRef}
                onMouseEnter={() => {
                  if (solutionsTimeoutRef.current) clearTimeout(solutionsTimeoutRef.current);
                  setShowSolutions(true);
                }}
                onMouseLeave={() => {
                  solutionsTimeoutRef.current = setTimeout(() => setShowSolutions(false), 200);
                }}
              >
                <button
                  className={`font-lato-medium transition-colors flex items-center gap-1.5 ${
                    isScrolled
                      ? 'text-dark-gray hover:text-purple-medium'
                      : 'text-white/90 hover:text-white'
                  }`}
                >
                  {link.label}
                  <ChevronDown className="text-xs" />
                </button>

                {showSolutions && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-purple-medium/10 p-3 z-50">
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-l border-t border-purple-medium/10"></div>
                    {solutionItems.map((item) => (
                      <button
                        key={item.name}
                        onClick={() => {
                          if (item.action) {
                            item.action();
                            setShowSolutions(false);
                          }
                        }}
                        disabled={!item.action}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                          item.action
                            ? 'hover:bg-lavender-light/40 cursor-pointer'
                            : 'opacity-50 cursor-default'
                        }`}
                      >
                        <img src={item.logo} alt={item.name} className="h-8 w-auto flex-shrink-0" />
                        <div>
                          <p className="font-lato-bold text-sm text-purple-intense">{item.name}</p>
                          <p className="text-xs text-soft-black/60 font-lato-light">{item.desc}</p>
                          {!item.action && (
                            <span className="text-[10px] text-purple-medium font-lato-bold">Próximamente</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
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
            )
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center space-x-3">
          {user ? (
            <>
              <Button
                variant="ghost"
                onClick={() => navigate(getDashboardPath())}
                className={`font-lato-medium ${
                  isScrolled ? 'text-purple-medium hover:bg-purple-medium/10' : 'text-white hover:bg-white/10'
                }`}
              >
                Dashboard
              </Button>
              <Button 
                onClick={() => signOut()}
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
                    ? 'bg-purple-intense hover:bg-purple-intense/90 text-white shadow-lg' 
                    : 'bg-white text-purple-intense hover:bg-white/90'
                }`}
              >
                Comenzar Gratis
                <ArrowRight className="ml-2 text-sm group-hover:translate-x-1 transition-transform" />
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`lg:hidden focus:outline-none ${isScrolled ? 'text-purple-intense' : 'text-white'}`}
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
                      navigate(getDashboardPath());
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-center px-4 py-3 rounded-lg border-2 border-purple-medium text-purple-medium font-lato-bold hover:bg-purple-medium hover:text-white transition-all"
                  >
                    Dashboard
                  </button>
                  <button 
                    onClick={() => {
                      setIsMenuOpen(false);
                      signOut();
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
                    className="block w-full text-center px-4 py-3 rounded-lg bg-purple-intense text-white font-lato-bold hover:opacity-90 transition-all"
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
