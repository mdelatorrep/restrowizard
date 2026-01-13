import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { Briefcase, Link2 } from 'lucide-react';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const consultantRef = searchParams.get('ref');
  const inviteToken = searchParams.get('invite');

  // Persist tokens so login/signup flows can claim/link after auth completes
  useEffect(() => {
    if (consultantRef) localStorage.setItem('consultantRef', consultantRef);
    if (inviteToken) localStorage.setItem('clientInviteToken', inviteToken);
  }, [consultantRef, inviteToken]);

  const hasReferral = Boolean(consultantRef || inviteToken);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-headline font-bold text-primary mb-2">RestroWizard</h1>
          <p className="text-muted-foreground font-lato-light">
            La magia de la IA para tu restaurante
          </p>
        </div>

        {hasReferral && (
          <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              {inviteToken ? (
                <>
                  <Link2 className="h-4 w-4 text-primary" />
                  <Badge variant="outline" className="text-primary border-primary">
                    Invitación de Cliente
                  </Badge>
                </>
              ) : (
                <>
                  <Briefcase className="h-4 w-4 text-primary" />
                  <Badge variant="outline" className="text-primary border-primary">
                    Invitación de Consultor
                  </Badge>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground font-lato-light">
              {inviteToken
                ? 'Te han invitado a unirte como cliente. Regístrate o inicia sesión para quedar vinculado automáticamente.'
                : 'Te han invitado a unirte a RestroWizard. Al registrarte serás vinculado con tu consultor.'}
            </p>
          </div>
        )}

        <Tabs defaultValue={hasReferral ? "signup" : "login"} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="signup">Registrarse</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <LoginForm />
          </TabsContent>
          
          <TabsContent value="signup">
            <SignupForm consultantRef={consultantRef} inviteToken={inviteToken} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;