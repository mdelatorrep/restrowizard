import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const checkInstalled = () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsInstalled(checkInstalled());

    // Register SW
    const registerSW = async () => {
      if (!('serviceWorker' in navigator)) return;
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        setRegistration(reg);
        console.log('✅ SW registered:', reg.scope);

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          }
        });

        // Check for updates periodically
        setInterval(() => reg.update(), 60 * 60 * 1000); // every hour
      } catch (err) {
        console.error('❌ SW registration failed:', err);
      }
    };

    registerSW();

    // Request persistent storage
    if (navigator.storage?.persist) {
      navigator.storage.persist().then((granted) => {
        console.log(granted ? '✅ Persistent storage granted' : '⚠️ Persistent storage denied');
      });
    }

    // Install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register periodic background sync if available
    registerPeriodicSync(null);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Register periodic sync when registration is available
  useEffect(() => {
    if (registration) registerPeriodicSync(registration);
  }, [registration]);

  const registerPeriodicSync = async (reg: ServiceWorkerRegistration | null) => {
    if (!reg) return;
    try {
      if ('periodicSync' in reg) {
        await (reg as any).periodicSync.register('check-alerts', {
          minInterval: 12 * 60 * 60 * 1000, // 12 hours
        });
        await (reg as any).periodicSync.register('update-dashboard', {
          minInterval: 6 * 60 * 60 * 1000, // 6 hours
        });
      }
    } catch {
      // periodic sync not available or not granted
    }
  };

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setIsInstallable(false);
      return outcome === 'accepted';
    } catch {
      return false;
    }
  }, [deferredPrompt]);

  const applyUpdate = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setUpdateAvailable(false);
      window.location.reload();
    }
  }, [registration]);

  const registerBackgroundSync = useCallback(async (tag: string) => {
    if (!registration) return false;
    try {
      await (registration as any).sync.register(tag);
      return true;
    } catch {
      return false;
    }
  }, [registration]);

  return {
    isInstalled,
    isInstallable,
    isOnline,
    updateAvailable,
    installApp,
    applyUpdate,
    canInstall: !!deferredPrompt,
    registration,
    registerBackgroundSync,
  };
};
