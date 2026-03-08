'use client';

import { useEffect, useMemo, useState } from 'react';

const PWA_INSTALL_DISMISSED_AT_KEY = 'luai_pwa_install_dismissed_at';
const PWA_INSTALL_DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function isStandaloneMode() {
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  const displayModeStandalone =
    typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches;
  return iosStandalone || displayModeStandalone;
}

function isDismissedRecently() {
  const rawValue = localStorage.getItem(PWA_INSTALL_DISMISSED_AT_KEY);
  if (!rawValue) return false;

  const dismissedAt = Number(rawValue);
  if (!Number.isFinite(dismissedAt)) return false;
  return Date.now() - dismissedAt < PWA_INSTALL_DISMISS_DURATION_MS;
}

export function InstallPromptBanner() {
  const [mounted, setMounted] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setMounted(true);
    setIsInstalled(isStandaloneMode());
    setIsDismissed(isDismissedRecently());

    const handleBeforeInstallPrompt = (event: Event) => {
      const installEvent = event as BeforeInstallPromptEvent;
      installEvent.preventDefault();
      setDeferredPrompt(installEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const canShow = useMemo(() => {
    return mounted && !isInstalled && !isDismissed && deferredPrompt;
  }, [mounted, isInstalled, isDismissed, deferredPrompt]);

  const handleDismiss = () => {
    localStorage.setItem(PWA_INSTALL_DISMISSED_AT_KEY, String(Date.now()));
    setIsDismissed(true);
    setDeferredPrompt(null);
  };

  const handleInstall = async () => {
    try {
      await deferredPrompt!.prompt();
      const choice = await deferredPrompt!.userChoice;

      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      } else {
        localStorage.setItem(PWA_INSTALL_DISMISSED_AT_KEY, String(Date.now()));
        setIsDismissed(true);
      }
    } catch {
      // Ignore prompt failures and hide banner for current session.
    } finally {
      setDeferredPrompt(null);
    }
  };

  if (!canShow) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-label="Instalar aplicacion"
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] left-1/2 -translate-x-1/2 z-[120] w-[min(40rem,calc(100vw-1rem))] rounded-xl border border-zinc-200 bg-white px-3 py-3 shadow-xl"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-900">Instala LuAI</p>
          <p className="text-xs text-zinc-600">Accede mas rapido desde tu pantalla principal.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100"
          >
            No gracias
          </button>
          <button
            type="button"
            onClick={handleInstall}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            Instalar
          </button>
        </div>
      </div>
    </div>
  );
}
