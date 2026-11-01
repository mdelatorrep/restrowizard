import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Repeat, Tv } from 'lucide-react';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { DEMO_ACCOUNTS, DEMO_BUSINESS_NAME, isDemoUserId } from '@/lib/demo';

/**
 * Franja fija mientras se navega con una cuenta demo: deja claro que el
 * restaurante es ficticio y permite cambiar de rol sin volver a la landing.
 */
export const DemoBar = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (!isDemoUserId(user?.id)) return null;
  const current = DEMO_ACCOUNTS.find(a => a.userId === user?.id);

  const switchRole = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate('/demo', { replace: true });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/20 bg-primary/10 px-4 py-2 text-sm">
      <span className="flex items-center gap-2 text-foreground/80">
        <Tv className="h-4 w-4 text-primary" />
        Demo · {DEMO_BUSINESS_NAME} · estás viendo como <strong>{current?.title.toLowerCase()}</strong>.
        <span className="hidden md:inline text-muted-foreground">Los datos vuelven a su estado original cada noche.</span>
      </span>
      <button onClick={switchRole} className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
        <Repeat className="h-3.5 w-3.5" /> Cambiar de rol
      </button>
    </div>
  );
};
