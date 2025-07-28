import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface UseInactivityTimerProps {
  timeout?: number; // tiempo en minutos
  warningTime?: number; // tiempo de aviso previo en segundos
}

export const useInactivityTimer = ({ 
  timeout = 10, 
  warningTime = 30 
}: UseInactivityTimerProps = {}) => {
  const [isWarningActive, setIsWarningActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(warningTime);
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningTimeoutRef = useRef<NodeJS.Timeout>();
  const countdownRef = useRef<NodeJS.Timeout>();

  const resetTimer = useCallback(() => {
    // Limpiar todos los timers existentes
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    setIsWarningActive(false);
    setTimeLeft(warningTime);

    if (!user) return;

    // Timer principal de inactividad
    timeoutRef.current = setTimeout(() => {
      setIsWarningActive(true);
      setTimeLeft(warningTime);
      
      toast({
        title: "⚠️ Sesión por expirar",
        description: `Tu sesión se cerrará en ${warningTime} segundos por inactividad`,
        variant: "destructive",
      });

      // Countdown del aviso
      countdownRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            signOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto logout después del warning
      warningTimeoutRef.current = setTimeout(() => {
        signOut();
        toast({
          title: "Sesión cerrada",
          description: "Tu sesión se cerró automáticamente por inactividad",
        });
      }, warningTime * 1000);

    }, timeout * 60 * 1000); // convertir minutos a milisegundos
  }, [user, timeout, warningTime, signOut, toast]);

  const extendSession = useCallback(() => {
    resetTimer();
    toast({
      title: "Sesión extendida",
      description: "Tu sesión se ha renovado correctamente",
    });
  }, [resetTimer, toast]);

  // Eventos que resetean el timer
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const resetTimerHandler = () => {
      if (!isWarningActive) {
        resetTimer();
      }
    };

    // Agregar event listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimerHandler, true);
    });

    // Inicializar timer
    resetTimer();

    return () => {
      // Cleanup
      events.forEach(event => {
        document.removeEventListener(event, resetTimerHandler, true);
      });
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [user, resetTimer, isWarningActive]);

  return {
    isWarningActive,
    timeLeft,
    extendSession,
    resetTimer
  };
};