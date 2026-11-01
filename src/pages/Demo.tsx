import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Briefcase, CreditCard, Crown, Loader2, Tv } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DEMO_ACCOUNTS, DEMO_BUSINESS_NAME, type DemoAccount, type DemoRole } from '@/lib/demo';
import SEOHead from '@/components/SEOHead';

const ICONS: Record<DemoRole, typeof Crown> = {
  owner: Crown,
  manager: Briefcase,
  cashier: CreditCard,
};

/**
 * Entrada a la demo: el dueño de un restaurante quiere ver algo funcionando antes
 * de registrarse. Cada tarjeta entra con una cuenta pública de un rol distinto,
 * sobre el mismo restaurante ficticio con 90 días de operación.
 */
const Demo = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loadingRole, setLoadingRole] = useState<DemoRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  const enter = async (account: DemoAccount) => {
    setError(null);
    setLoadingRole(account.role);
    try {
      // Cambiar de rol = cambiar de usuario: nada de la sesión anterior debe quedar en caché.
      await supabase.auth.signOut();
      queryClient.clear();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password,
      });
      if (signInError) throw signInError;
      navigate(account.landing, { replace: true });
    } catch (e) {
      setError('No pudimos abrir la demo en este momento. Intenta de nuevo en unos segundos.');
      setLoadingRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-intense via-purple-intense to-[#1d1027] text-white">
      <SEOHead
        title="Demo en vivo · RestroWizard"
        description="Entra a un sports bar con 90 días de operación real simulada: ventas, propinas, horarios e inventario."
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-white/50 hover:text-white/80 transition-colors mb-10"
        >
          ← Volver
        </button>

        <div className="max-w-3xl space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-widest text-white/70">
            <Tv className="h-3.5 w-3.5" /> Demo en vivo
          </span>
          <h1 className="text-4xl sm:text-6xl font-headline leading-[1.05] tracking-tight">
            Entra a {DEMO_BUSINESS_NAME}
          </h1>
          <p className="text-lg sm:text-xl font-lato-light text-white/65 leading-relaxed">
            Un sports bar en Laureles con 25 personas, 32 mesas y la temporada de NFL y Champions encima.
            Tiene 90 días de operación y las ventas de hoy se van sumando cada hora.
            Elige con qué rol quieres entrar: cada uno ve lo suyo.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {DEMO_ACCOUNTS.map(account => {
            const Icon = ICONS[account.role];
            const isLoading = loadingRole === account.role;
            return (
              <button
                key={account.role}
                onClick={() => enter(account)}
                disabled={loadingRole !== null}
                className="group text-left rounded-2xl border border-white/15 bg-white/[0.04] p-6 hover:bg-white/[0.08] hover:border-white/30 transition-all disabled:opacity-60 flex flex-col"
              >
                <div className="flex items-center justify-between">
                  <div className="h-11 w-11 rounded-xl bg-white/10 flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs text-white/45">{account.person}</span>
                </div>
                <h2 className="mt-5 text-2xl font-headline">{account.title}</h2>
                <p className="mt-2 text-sm font-lato-light text-white/70 leading-relaxed">{account.pitch}</p>
                <ul className="mt-5 space-y-2 text-sm text-white/80 flex-1">
                  {account.highlights.map(h => (
                    <li key={h} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lavender-light" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
                <span className="mt-6 inline-flex items-center gap-2 font-lato-bold">
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Entrando…</>
                  ) : (
                    <>Entrar como {account.title.toLowerCase()} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {error && <p className="mt-6 text-sm text-red-300">{error}</p>}

        <p className="mt-10 text-sm text-white/40 max-w-2xl">
          Restaurante y personas ficticios. Puedes cambiar lo que quieras: todo vuelve a su estado original cada noche.
        </p>
      </div>
    </div>
  );
};

export default Demo;
