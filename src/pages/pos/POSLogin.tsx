import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePOSContext } from "@/hooks/usePOSContext";
import { POSShell } from "@/components/pos-standalone/POSShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Delete, KeyRound, Loader2, Lock, Mail } from "lucide-react";

const PIN_MAX = 6;

export default function POSLogin() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { context, loading, error } = usePOSContext(slug);

  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);

  // SSO: if a session already exists and the user is the restaurant owner or a linked staff,
  // go straight to the POS.
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session && context) {
        const uid = data.session.user.id;
        if (uid === context.restaurantUserId) {
          navigate(`/${slug}/pos`, { replace: true });
          return;
        }
        const { data: staffMatch } = await supabase
          .from("staff_members")
          .select("id")
          .eq("linked_user_id", uid)
          .eq("user_id", context.restaurantUserId)
          .maybeSingle();
        if (staffMatch) {
          navigate(`/${slug}/pos`, { replace: true });
          return;
        }
      }
      setChecking(false);
    };
    if (context) check();
    return () => {
      cancelled = true;
    };
  }, [context, slug, navigate]);

  const pressKey = (k: string) => {
    if (submitting) return;
    setPin((p) => (p.length >= PIN_MAX ? p : p + k));
  };
  const pressDel = () => setPin((p) => p.slice(0, -1));

  const submitPin = async () => {
    if (!slug || pin.length < 4) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("pos-pin-login", {
        body: { slug, pin },
      });
      if (error) throw error;
      if (!data?.token_hash || !data?.email) {
        throw new Error(data?.error || "PIN inválido");
      }
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        type: "magiclink",
        token_hash: data.token_hash,
      });
      if (verifyErr) throw verifyErr;
      toast({ title: `Bienvenido, ${data.staff?.name || "cajero"}` });
      navigate(`/${slug}/pos`, { replace: true });
    } catch (e: any) {
      console.error(e);
      toast({
        title: "No se pudo iniciar sesión",
        description: e?.message || "PIN inválido",
        variant: "destructive",
      });
      setPin("");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (pin.length === PIN_MAX) submitPin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate(`/${slug}/pos`, { replace: true });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || checking) {
    return (
      <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 grid place-items-center">
        <Loader2 className="h-10 w-10 animate-spin opacity-60" />
      </div>
    );
  }

  if (error === "not_found" || !context) {
    return (
      <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 grid place-items-center p-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Restaurante no encontrado</h1>
          <p className="text-zinc-400">Revisa la URL e inténtalo de nuevo.</p>
        </div>
      </div>
    );
  }

  return (
    <POSShell context={context}>
      <div className="flex-1 grid place-items-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            {context.brand.logo_url ? (
              <img
                src={context.brand.logo_url}
                alt={context.restaurantName}
                className="h-16 mx-auto mb-3 object-contain"
              />
            ) : (
              <div className="h-16 w-16 mx-auto mb-3 rounded-2xl bg-zinc-800 grid place-items-center">
                <Lock className="h-7 w-7" />
              </div>
            )}
            <h1 className="text-2xl font-semibold">{context.restaurantName}</h1>
            <p className="text-sm text-zinc-400">Portal de Ventas</p>
          </div>

          <Tabs defaultValue="pin" className="w-full">
            <TabsList className="grid grid-cols-2 w-full bg-zinc-900 border border-zinc-800">
              <TabsTrigger value="pin" className="data-[state=active]:bg-zinc-800">
                <KeyRound className="h-4 w-4 mr-2" /> PIN
              </TabsTrigger>
              <TabsTrigger value="email" className="data-[state=active]:bg-zinc-800">
                <Mail className="h-4 w-4 mr-2" /> Email
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pin" className="mt-4">
              <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
                <div className="flex justify-center gap-2 my-4">
                  {Array.from({ length: PIN_MAX }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-3 w-3 rounded-full transition-all ${
                        i < pin.length ? "bg-[var(--pos-accent)]" : "bg-zinc-700"
                      }`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => (
                    <button
                      key={k}
                      onClick={() => pressKey(k)}
                      disabled={submitting}
                      className="h-16 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-2xl font-medium transition disabled:opacity-50"
                    >
                      {k}
                    </button>
                  ))}
                  <div />
                  <button
                    onClick={() => pressKey("0")}
                    disabled={submitting}
                    className="h-16 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-2xl font-medium transition disabled:opacity-50"
                  >
                    0
                  </button>
                  <button
                    onClick={pressDel}
                    disabled={submitting}
                    className="h-16 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 grid place-items-center transition disabled:opacity-50"
                  >
                    <Delete className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-xs text-zinc-500 text-center mt-4">
                  Ingresa tu PIN de 4 a 6 dígitos.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="email" className="mt-4">
              <form
                onSubmit={submitPassword}
                className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 space-y-3"
              >
                <div>
                  <Label htmlFor="email" className="text-zinc-300">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div>
                  <Label htmlFor="pwd" className="text-zinc-300">
                    Contraseña
                  </Label>
                  <Input
                    id="pwd"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[var(--pos-accent)] hover:opacity-90 text-zinc-900"
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ingresar"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <button
            onClick={() => navigate("/r/dashboard")}
            className="mt-4 w-full text-center text-xs text-zinc-500 hover:text-zinc-300 py-2"
          >
            Ir al portal administrativo
          </button>
        </div>
      </div>
    </POSShell>
  );
}
