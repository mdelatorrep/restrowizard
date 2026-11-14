import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface Props {
  slug: string;
  restaurantName: string;
}

type Result = { status: 'created'; code: string } | { status: 'exists' | 'error'; message: string };

/** C-14: el comensal se inscribe desde el sitio, sin pasar por la caja. */
export function LoyaltyEnrollForm({ slug, restaurantName }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    const { data, error } = await supabase.rpc('public_loyalty_enroll' as never, {
      p_slug: slug,
      p_name: name,
      p_phone: phone,
      p_email: email || null,
      p_consent: consent,
    } as never);
    setSending(false);
    if (error) {
      setResult({ status: 'error', message: 'No pudimos inscribirte. Intenta de nuevo en un momento.' });
      return;
    }
    setResult(data as unknown as Result);
  };

  if (result?.status === 'created') {
    return (
      <Card className="border-primary/30">
        <CardHeader className="text-center">
          <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-2" />
          <CardTitle className="text-2xl">¡Ya eres parte del programa!</CardTitle>
          <CardDescription>Guarda tu código. Lo dices en caja para sumar puntos en cada compra.</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4 pb-8">
          <p className="font-mono text-3xl tracking-widest">{result.code}</p>
          <Button asChild size="lg">
            <Link to={`/mi-fidelidad/${result.code}`}>Ver mis puntos y premios</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
        <CardTitle className="text-2xl">Inscríbete ahora</CardTitle>
        <CardDescription>Recibe tu código al instante y empieza a sumar puntos en {restaurantName}.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4 max-w-md mx-auto">
          <div className="space-y-2">
            <Label htmlFor="lf-name">Nombre</Label>
            <Input id="lf-name" required minLength={2} maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lf-phone">Celular</Label>
            <Input id="lf-phone" required inputMode="tel" placeholder="300 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lf-email">Correo (opcional)</Label>
            <Input id="lf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <label className="flex items-start gap-2 text-sm text-muted-foreground cursor-pointer">
            <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
            <span>
              Autorizo a {restaurantName} a tratar mis datos para el programa de fidelidad, según la{' '}
              <Link to="/privacy" className="underline" target="_blank">política de privacidad</Link>.
            </span>
          </label>
          {result && 'message' in result && (
            <p className="text-sm text-destructive" role="alert">{result.message}</p>
          )}
          <Button type="submit" className="w-full" size="lg" disabled={sending || !consent}>
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Quiero mi código'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
