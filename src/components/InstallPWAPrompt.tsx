import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X, Smartphone, RefreshCw } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

const InstallPWAPrompt = () => {
  const { isInstalled, isInstallable, installApp, updateAvailable, applyUpdate } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    if (isInstallable && !localStorage.getItem('pwa-prompt-dismissed')) {
      const timer = setTimeout(() => setShowPrompt(true), 30000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable]);

  useEffect(() => {
    if (updateAvailable) setShowUpdate(true);
  }, [updateAvailable]);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Update banner
  if (showUpdate) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
        <Card className="bg-card border-primary/20 shadow-lg">
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <RefreshCw className="h-5 w-5 text-primary animate-spin" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Nueva versión disponible</p>
            </div>
            <Button size="sm" onClick={applyUpdate} className="bg-primary text-primary-foreground">
              Actualizar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isInstalled || !showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Card className="bg-card border-primary/20 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="text-primary h-5 w-5" />
              <CardTitle className="text-lg font-headline text-foreground">
                Instalar RestroWizard
              </CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDismiss} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Instala la app para acceso rápido, notificaciones push y modo offline.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2">
            <Button onClick={installApp} className="flex-1 bg-primary text-primary-foreground" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Instalar App
            </Button>
            <Button variant="outline" onClick={handleDismiss} size="sm">
              Ahora no
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstallPWAPrompt;
