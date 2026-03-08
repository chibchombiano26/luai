'use client';

import { useEffect, useState } from 'react';

export function NetworkStatusBanner() {
  const [mounted] = useState(() => typeof window !== 'undefined');
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  );
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  useEffect(() => {
    let onlineToastTimeout: ReturnType<typeof setTimeout> | undefined;

    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineToast(true);
      onlineToastTimeout = setTimeout(() => {
        setShowOnlineToast(false);
      }, 2500);
    };

    const handleOffline = () => {
      setShowOnlineToast(false);
      setIsOnline(false);
      if (onlineToastTimeout) {
        clearTimeout(onlineToastTimeout);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (onlineToastTimeout) {
        clearTimeout(onlineToastTimeout);
      }
    };
  }, []);

  if (!mounted) {
    return null;
  }

  if (!isOnline) {
    return (
      <div
        role="status"
        className="fixed top-2 left-1/2 -translate-x-1/2 z-[120] w-[min(36rem,calc(100vw-1rem))] bg-red-600 text-white text-sm px-3 py-2 rounded-lg shadow-lg"
      >
        Sin conexion. Necesitas internet para usar el chat y generar cotizaciones.
      </div>
    );
  }

  if (showOnlineToast) {
    return (
      <div
        role="status"
        className="fixed top-2 left-1/2 -translate-x-1/2 z-[120] w-[min(30rem,calc(100vw-1rem))] bg-emerald-600 text-white text-sm px-3 py-2 rounded-lg shadow-lg"
      >
        Conexion restablecida.
      </div>
    );
  }

  return null;
}
