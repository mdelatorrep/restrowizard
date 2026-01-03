import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useActiveClient } from '@/contexts/ActiveClientContext';
import { ClientSelector } from './ClientSelector';

interface RequireActiveClientProps {
  children: ReactNode;
  moduleName: string;
}

export const RequireActiveClient: React.FC<RequireActiveClientProps> = ({ 
  children, 
  moduleName 
}) => {
  const navigate = useNavigate();
  const { activeClient, clients, loading } = useActiveClient();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-lato-light">Cargando...</p>
        </div>
      </div>
    );
  }

  const activeClients = clients.filter(c => c.status === 'active');

  if (!activeClient) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-headline text-2xl">
              Selecciona un Cliente
            </CardTitle>
            <CardDescription className="font-lato-light">
              Para acceder al módulo de <strong>{moduleName}</strong>, primero debes seleccionar el restaurante con el que deseas trabajar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {activeClients.length > 0 ? (
              <>
                <ClientSelector />
                <div className="text-center text-sm text-muted-foreground">
                  <span className="font-lato-light">
                    Tienes {activeClients.length} cliente{activeClients.length > 1 ? 's' : ''} activo{activeClients.length > 1 ? 's' : ''}
                  </span>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground font-lato-light">
                    No tienes clientes activos aún
                  </p>
                </div>
                <Button 
                  onClick={() => navigate('/c/dashboard')} 
                  className="w-full"
                >
                  Ir a Vista General
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
