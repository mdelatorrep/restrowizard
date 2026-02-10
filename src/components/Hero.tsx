import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserType } from '@/hooks/useUserType';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

const Hero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userType } = useUserType();

  const getLoggedInPath = () => {
    if (userType === 'consultant') return '/c/dashboard';
    if (userType === 'restaurant_owner') return '/r/dashboard';
    return '/onboarding';
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-intense via-purple-intense/95 to-soft-black" />
      
      {/* Single soft glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-medium/15 rounded-full blur-[120px]" />

      <div className="relative container mx-auto px-6 pt-32 pb-24 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-headline leading-[1.05] tracking-tight text-white">
            Tu restaurante.
            <br />
            <span className="text-lavender-light">100% digital.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl font-lato-light text-white/60 max-w-2xl mx-auto leading-relaxed">
            Sitio web, reservas, delivery e inteligencia artificial.
            <br className="hidden md:block" />
            Todo en una sola plataforma.
          </p>

          {/* Single CTA */}
          <div className="pt-4">
            <button
              onClick={() => user ? navigate(getLoggedInPath()) : navigate('/auth')}
              className="group inline-flex items-center gap-3 bg-white text-purple-intense font-lato-bold text-lg px-10 py-5 rounded-full hover:bg-white/90 transition-all duration-300 shadow-lg shadow-white/10"
            >
              <span>{user ? 'Ir al Dashboard' : 'Comenzar gratis'}</span>
              <FontAwesomeIcon
                icon={faArrowRight}
                className="text-sm group-hover:translate-x-1 transition-transform"
              />
            </button>
          </div>

          {/* Minimal trust line */}
          <p className="text-sm font-lato-light text-white/40 pt-2">
            Sin tarjeta de crédito · Activo en 10 minutos · +500 restaurantes
          </p>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
        <div className="w-5 h-9 border-2 border-white/20 rounded-full flex justify-center">
          <div className="w-1 h-2.5 bg-white/40 rounded-full mt-2 animate-bounce" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
