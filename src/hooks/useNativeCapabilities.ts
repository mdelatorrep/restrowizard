import { useState, useEffect, useCallback } from 'react';

// ─── Badging API ────────────────────────────────────────────
export const useBadging = () => {
  const isSupported = 'setAppBadge' in navigator;

  const setBadge = useCallback(async (count?: number) => {
    if (!isSupported) return false;
    try {
      await (navigator as any).setAppBadge(count);
      return true;
    } catch { return false; }
  }, [isSupported]);

  const clearBadge = useCallback(async () => {
    if (!isSupported) return false;
    try {
      await (navigator as any).clearAppBadge();
      return true;
    } catch { return false; }
  }, [isSupported]);

  return { isSupported, setBadge, clearBadge };
};

// ─── Screen Wake Lock ───────────────────────────────────────
export const useWakeLock = () => {
  const [wakeLock, setWakeLock] = useState<any>(null);
  const isSupported = 'wakeLock' in navigator;

  const request = useCallback(async () => {
    if (!isSupported) return false;
    try {
      const lock = await (navigator as any).wakeLock.request('screen');
      setWakeLock(lock);
      lock.addEventListener('release', () => setWakeLock(null));
      return true;
    } catch { return false; }
  }, [isSupported]);

  const release = useCallback(async () => {
    if (wakeLock) {
      await wakeLock.release();
      setWakeLock(null);
    }
  }, [wakeLock]);

  return { isSupported, isActive: !!wakeLock, request, release };
};

// ─── Web Share API ──────────────────────────────────────────
export const useWebShare = () => {
  const isSupported = 'share' in navigator;

  const share = useCallback(async (data: ShareData) => {
    if (!isSupported) return false;
    try {
      await navigator.share(data);
      return true;
    } catch { return false; }
  }, [isSupported]);

  const canShareFiles = 'canShare' in navigator;

  return { isSupported, share, canShareFiles };
};

// ─── Vibration API ──────────────────────────────────────────
export const useVibration = () => {
  const isSupported = 'vibrate' in navigator;

  const vibrate = useCallback((pattern: number | number[]) => {
    if (!isSupported) return false;
    return navigator.vibrate(pattern);
  }, [isSupported]);

  const stop = useCallback(() => {
    if (isSupported) navigator.vibrate(0);
  }, [isSupported]);

  return { isSupported, vibrate, stop };
};

// ─── Network Information API ────────────────────────────────
export const useNetworkInfo = () => {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  const [info, setInfo] = useState({
    effectiveType: connection?.effectiveType || 'unknown',
    downlink: connection?.downlink || 0,
    rtt: connection?.rtt || 0,
    saveData: connection?.saveData || false,
  });

  useEffect(() => {
    if (!connection) return;
    const update = () => setInfo({
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    });
    connection.addEventListener('change', update);
    return () => connection.removeEventListener('change', update);
  }, []);

  return { isSupported: !!connection, ...info };
};

// ─── Notification API ───────────────────────────────────────
export const useNotifications = () => {
  const isSupported = 'Notification' in window;
  const [permission, setPermission] = useState<NotificationPermission>(
    isSupported ? Notification.permission : 'denied'
  );

  const requestPermission = useCallback(async () => {
    if (!isSupported) return 'denied' as NotificationPermission;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, [isSupported]);

  const showNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') return null;
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      return reg.showNotification(title, options);
    }
    return new Notification(title, options);
  }, [isSupported, permission]);

  return { isSupported, permission, requestPermission, showNotification };
};

// ─── Persistent Storage ─────────────────────────────────────
export const usePersistentStorage = () => {
  const isSupported = navigator.storage && 'persist' in navigator.storage;

  const request = useCallback(async () => {
    if (!isSupported) return false;
    return navigator.storage.persist();
  }, [isSupported]);

  const estimate = useCallback(async () => {
    if (!navigator.storage?.estimate) return null;
    return navigator.storage.estimate();
  }, []);

  return { isSupported, request, estimate };
};

// ─── Geolocation API ────────────────────────────────────────
export const useGeolocation = () => {
  const isSupported = 'geolocation' in navigator;
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);

  const getCurrentPosition = useCallback((options?: PositionOptions) => {
    if (!isSupported) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => { setPosition(pos); setError(null); },
      (err) => { setError(err); },
      options
    );
  }, [isSupported]);

  return { isSupported, position, error, getCurrentPosition };
};

// ─── Fullscreen API ─────────────────────────────────────────
export const useFullscreen = () => {
  const isSupported = document.fullscreenEnabled;
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const enter = useCallback(async (el?: HTMLElement) => {
    try {
      await (el || document.documentElement).requestFullscreen();
      return true;
    } catch { return false; }
  }, []);

  const exit = useCallback(async () => {
    try {
      await document.exitFullscreen();
      return true;
    } catch { return false; }
  }, []);

  return { isSupported, isFullscreen, enter, exit };
};

// ─── Screen Orientation API ─────────────────────────────────
export const useScreenOrientation = () => {
  const isSupported = 'orientation' in screen;
  const [orientation, setOrientation] = useState(
    isSupported ? screen.orientation.type : 'unknown'
  );

  useEffect(() => {
    if (!isSupported) return;
    const handler = () => setOrientation(screen.orientation.type);
    screen.orientation.addEventListener('change', handler);
    return () => screen.orientation.removeEventListener('change', handler);
  }, [isSupported]);

  const lock = useCallback(async (type: OrientationLockType) => {
    if (!isSupported) return false;
    try {
      await screen.orientation.lock(type);
      return true;
    } catch { return false; }
  }, [isSupported]);

  return { isSupported, orientation, lock };
};

// ─── Clipboard API ──────────────────────────────────────────
export const useClipboard = () => {
  const isSupported = 'clipboard' in navigator;

  const copy = useCallback(async (text: string) => {
    if (!isSupported) return false;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch { return false; }
  }, [isSupported]);

  const read = useCallback(async () => {
    if (!isSupported) return null;
    try {
      return await navigator.clipboard.readText();
    } catch { return null; }
  }, [isSupported]);

  return { isSupported, copy, read };
};

// ─── Device Memory API ──────────────────────────────────────
export const useDeviceMemory = () => {
  const memory = (navigator as any).deviceMemory;
  return { isSupported: !!memory, deviceMemory: memory || null };
};

// ─── Battery API ────────────────────────────────────────────
export const useBattery = () => {
  const [battery, setBattery] = useState<any>(null);

  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((b: any) => {
        setBattery({
          charging: b.charging,
          level: b.level,
          chargingTime: b.chargingTime,
          dischargingTime: b.dischargingTime,
        });
        const update = () => setBattery({
          charging: b.charging,
          level: b.level,
          chargingTime: b.chargingTime,
          dischargingTime: b.dischargingTime,
        });
        b.addEventListener('chargingchange', update);
        b.addEventListener('levelchange', update);
      });
    }
  }, []);

  return { isSupported: 'getBattery' in navigator, ...battery };
};

// ─── Media Session API ──────────────────────────────────────
export const useMediaSession = () => {
  const isSupported = 'mediaSession' in navigator;

  const setMetadata = useCallback((metadata: MediaMetadataInit) => {
    if (!isSupported) return;
    navigator.mediaSession.metadata = new MediaMetadata(metadata);
  }, [isSupported]);

  const setActionHandler = useCallback((action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
    if (!isSupported) return;
    try {
      navigator.mediaSession.setActionHandler(action, handler);
    } catch { /* action not supported */ }
  }, [isSupported]);

  return { isSupported, setMetadata, setActionHandler };
};

// ─── Idle Detection API ─────────────────────────────────────
export const useIdleDetection = () => {
  const isSupported = 'IdleDetector' in window;

  const start = useCallback(async (callback: (state: { user: string; screen: string }) => void, threshold = 60000) => {
    if (!isSupported) return null;
    try {
      const permission = await (window as any).IdleDetector.requestPermission();
      if (permission !== 'granted') return null;
      const detector = new (window as any).IdleDetector();
      detector.addEventListener('change', () => {
        callback({ user: detector.userState, screen: detector.screenState });
      });
      await detector.start({ threshold });
      return detector;
    } catch { return null; }
  }, [isSupported]);

  return { isSupported, start };
};

// ─── Master hook: aggregated capabilities status ────────────
export const useNativeCapabilities = () => {
  return {
    badging: 'setAppBadge' in navigator,
    wakeLock: 'wakeLock' in navigator,
    share: 'share' in navigator,
    vibration: 'vibrate' in navigator,
    notifications: 'Notification' in window,
    geolocation: 'geolocation' in navigator,
    clipboard: 'clipboard' in navigator,
    fullscreen: document.fullscreenEnabled,
    orientation: 'orientation' in screen,
    persistentStorage: !!(navigator.storage && 'persist' in navigator.storage),
    networkInfo: !!((navigator as any).connection),
    battery: 'getBattery' in navigator,
    deviceMemory: 'deviceMemory' in navigator,
    mediaSession: 'mediaSession' in navigator,
    idleDetection: 'IdleDetector' in window,
    serviceWorker: 'serviceWorker' in navigator,
    pushManager: 'PushManager' in window,
    indexedDB: 'indexedDB' in window,
    cacheStorage: 'caches' in window,
    webAuth: 'credentials' in navigator,
    bluetooth: 'bluetooth' in navigator,
    usb: 'usb' in navigator,
    serial: 'serial' in navigator,
    nfc: 'NDEFReader' in window,
    gamepad: 'getGamepads' in navigator,
    speechRecognition: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
    speechSynthesis: 'speechSynthesis' in window,
  };
};
