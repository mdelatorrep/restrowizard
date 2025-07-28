import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Clock, LogOut, RefreshCw } from 'lucide-react';

interface InactivityWarningProps {
  isOpen: boolean;
  timeLeft: number;
  onExtend: () => void;
  onLogout: () => void;
}

const InactivityWarning: React.FC<InactivityWarningProps> = ({
  isOpen,
  timeLeft,
  onExtend,
  onLogout
}) => {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Clock className="w-5 h-5" />
            Sesión por Expirar
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="text-6xl font-bold text-destructive">
                {timeLeft}
              </div>
              <p className="text-muted-foreground">
                Tu sesión se cerrará automáticamente por inactividad
              </p>
              <p className="text-sm text-muted-foreground">
                ¿Deseas continuar trabajando?
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2">
          <AlertDialogCancel asChild>
            <Button 
              variant="outline" 
              onClick={onLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button 
              onClick={onExtend}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90"
            >
              <RefreshCw className="w-4 h-4" />
              Continuar Sesión
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default InactivityWarning;