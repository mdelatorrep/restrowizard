import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Shield, UserPlus } from 'lucide-react';
import { SeedAdminSchema } from '@/lib/schemas/adminSeed';

const AdminSettings: React.FC = () => {
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  const seedAdmin = useMutation({
    mutationFn: async (adminEmail: string) => {
      const { data, error } = await supabase.rpc('seed_platform_admin', {
        p_email: adminEmail,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string; user_id?: string };
      if (!result.success) throw new Error(result.error || 'Error desconocido');
      return result;
    },
    onSuccess: () => {
      toast({ title: '¡Admin añadido!', description: `${email} ahora es super admin.` });
      setEmail('');
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-headline font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground">Configuración global de la plataforma</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Añadir Super Admin
          </CardTitle>
          <CardDescription>
            Ingresa el email de un usuario registrado para otorgarle acceso de super administrador.
            El usuario debe tener una cuenta existente en la plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              type="email"
              placeholder="email@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={() => {
                const parsed = SeedAdminSchema.safeParse({ email });
                if (!parsed.success) {
                  toast({ title: 'Email inválido', description: parsed.error.issues[0]?.message, variant: 'destructive' });
                  return;
                }
                seedAdmin.mutate(parsed.data.email);
              }}
              disabled={!email || seedAdmin.isPending}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {seedAdmin.isPending ? 'Añadiendo...' : 'Añadir Admin'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
