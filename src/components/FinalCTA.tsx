import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ArrowRight } from 'lucide-react';
const FinalCTA = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="py-32 bg-purple-intense relative overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-medium/20 rounded-full blur-[120px]" />

      <div className="relative container mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-headline text-white leading-tight mb-6">
          Empieza hoy.
          <br />
          <span className="text-lavender-light">Es gratis.</span>
        </h2>
        <p className="text-lg font-lato-light text-white/50 mb-10 max-w-lg mx-auto">
          Crea tu sitio web, activa reservas y conecta la IA a tu restaurante en menos de 10 minutos.
        </p>
        <button
          onClick={() => navigate(user ? '/r/dashboard' : '/auth')}
          className="group inline-flex items-center gap-3 bg-white text-purple-intense font-lato-bold text-lg px-10 py-5 rounded-full hover:bg-white/90 transition-all duration-300 shadow-lg shadow-white/10"
        >
          <span>{user ? 'Ir al Dashboard' : 'Crear mi cuenta gratis'}</span>
          <ArrowRight className="text-sm group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </section>
  );
};

export default FinalCTA;
