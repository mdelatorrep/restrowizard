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
  const userId = user?.id;
  const signOutRef = useRef(signOut);
  const toastRef = useRef(toast);
  const warningActiveRef = useRef(false);

  useEffect(() => {
    signOutRef.current = signOut;
    toastRef.current = toast;
  }, [signOut, toast]);

  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const countdownRef = useRef<ReturnType<typeof setTimeout>>();

  const resetTimer = useCallback(() => {
    // Limpiar todos los timers existentes
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    warningActiveRef.current = false;
    setIsWarningActive(false);
    setTimeLeft(warningTime);

    if (!userId) return;

    // Timer principal de inactividad
    timeoutRef.current = setTimeout(() => {
      warningActiveRef.current = true;
      setIsWarningActive(true);
      setTimeLeft(warningTime);
      
      toastRef.current({
        title: "⚠️ Sesión por expirar",
        description: `Tu sesión se cerrará en ${warningTime} segundos por inactividad`,
        variant: "destructive",
      });

      // Countdown del aviso
      countdownRef.current = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);

      // Auto logout después del warning
      warningTimeoutRef.current = setTimeout(() => {
        if (countdownRef.current) clearInterval(countdownRef.current);
        signOutRef.current();
        toastRef.current({
          title: "Sesión cerrada",
          description: "Tu sesión se cerró automáticamente por inactividad",
        });
      }, warningTime * 1000);

    }, Math.max(0, timeout * 60 * 1000 - warningTime * 1000));
  }, [userId, timeout, warningTime]);

  const extendSession = useCallback(() => {
    resetTimer();
    toastRef.current({
      title: "Sesión extendida",
      description: "Tu sesión se ha renovado correctamente",
    });
  }, [resetTimer]);

  // Eventos que resetean el timer
  useEffect(() => {
    if (!userId) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const resetTimerHandler = () => {
      if (!warningActiveRef.current) {
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
  }, [userId, resetTimer]);

  return {
    isWarningActive,
    timeLeft,
    extendSession,
    resetTimer
  };
};