'use client';

import { SignInButton, useUser } from '@clerk/nextjs';
import { Languages } from 'lucide-react';
import Image from 'next/image';
import { useState, useSyncExternalStore } from 'react';
import { Chat } from '@/components/chat/Chat';
import { AppLocale, normalizeLocale } from '@/lib/i18n';
import {
  LOCALE_STORAGE_KEY,
  LEGACY_LOCALE_STORAGE_KEYS,
} from '@/components/chat/chat-constants';
import { getCompatStorageItem, setCompatStorageItem } from '@/lib/browser-storage';

const AUTH_COPY: Record<
  AppLocale,
  {
    cta: string;
  }
> = {
  es: {
    cta: 'Ingresar a LuAI',
  },
  en: {
    cta: 'Sign in to LuAI',
  },
};

const AUTH_VIDEO_VARIANTS = [
  {
    videoSrc: '/api/auth-media/loader-1-lite',
    posterSrc: '/api/auth-media/loader-1-poster',
  },
  {
    videoSrc: '/api/auth-media/loader-2-lite',
    posterSrc: '/api/auth-media/loader-2-poster',
  },
] as const;

function resolveInitialLocale(): AppLocale {
  if (typeof window === 'undefined') {
    return 'es';
  }

  const storedLocale = getCompatStorageItem(
    localStorage,
    LOCALE_STORAGE_KEY,
    LEGACY_LOCALE_STORAGE_KEYS
  );

  return normalizeLocale(storedLocale);
}

function LuAiSignInScreen() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [locale, setLocale] = useState<AppLocale>(() => resolveInitialLocale());
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const displayLocale = mounted ? locale : 'es';
  const copy = AUTH_COPY[displayLocale];
  const activeVideo = AUTH_VIDEO_VARIANTS[activeVideoIndex];

  const changeLocale = (nextLocale: AppLocale) => {
    setLocale(nextLocale);
    setCompatStorageItem(
      localStorage,
      LOCALE_STORAGE_KEY,
      nextLocale,
      LEGACY_LOCALE_STORAGE_KEYS
    );
    document.cookie = `app_locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
  };

  const handleVideoEnded = () => {
    setActiveVideoIndex((currentIndex) => (currentIndex + 1) % AUTH_VIDEO_VARIANTS.length);
  };

  return (
    <section className="w-full max-w-3xl mx-auto px-4 py-6 md:px-6 md:py-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-zinc-200 bg-[linear-gradient(180deg,#fbfdff_0%,#eef6ff_100%)] px-5 py-5 shadow-[0_28px_80px_rgba(15,23,42,0.1)] dark:border-zinc-800 dark:bg-[linear-gradient(180deg,#09090b_0%,#111827_100%)] md:px-8 md:py-8">
        <div className="pointer-events-none absolute left-[-14%] top-[-10%] h-56 w-56 rounded-full bg-blue-300/25 blur-3xl dark:bg-blue-500/12" />
        <div className="pointer-events-none absolute bottom-[-12%] right-[-10%] h-56 w-56 rounded-full bg-cyan-200/35 blur-3xl dark:bg-cyan-400/10" />

        <div className="relative z-10 flex justify-end">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/90 px-2 py-1 text-sm text-zinc-600 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300">
            <Languages className="h-4 w-4" />
            <div className="flex items-center gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-800">
              <button
                type="button"
                onClick={() => changeLocale('es')}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  displayLocale === 'es'
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-700'
                }`}
              >
                ES
              </button>
              <button
                type="button"
                onClick={() => changeLocale('en')}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  displayLocale === 'en'
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-700'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-5 flex flex-col items-center gap-6 md:mt-6 md:gap-8">
          <div className="relative flex w-full justify-center">
            <div className="pointer-events-none absolute inset-x-8 top-6 h-28 rounded-full bg-blue-400/20 blur-3xl dark:bg-blue-500/12 md:inset-x-16" />
            <div className="relative w-full max-w-[420px] rounded-[2.25rem] border border-white/70 bg-white/45 p-3 shadow-[0_36px_100px_rgba(15,23,42,0.16)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 md:max-w-[500px] md:p-4">
              <div className="overflow-hidden rounded-[1.8rem] border border-white/80 bg-white/80 shadow-[0_30px_80px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-zinc-950/55">
                <div className="relative aspect-[16/10] w-full">
                  <Image
                    src={activeVideo.posterSrc}
                    alt="LuAI preview"
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 500px"
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                      videoReady && !videoFailed ? 'opacity-0' : 'opacity-100'
                    }`}
                  />
                  <video
                    key={activeVideo.videoSrc}
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                      videoReady && !videoFailed ? 'opacity-100' : 'opacity-0'
                    }`}
                    autoPlay
                    muted
                    playsInline
                    preload="auto"
                    poster={activeVideo.posterSrc}
                    src={activeVideo.videoSrc}
                    onLoadStart={() => {
                      setVideoReady(false);
                      setVideoFailed(false);
                    }}
                    onCanPlay={() => setVideoReady(true)}
                    onLoadedData={() => setVideoReady(true)}
                    onPlaying={() => setVideoReady(true)}
                    onError={() => setVideoFailed(true)}
                    onEnded={handleVideoEnded}
                  />
                </div>
              </div>
            </div>
          </div>

          <SignInButton mode="redirect" fallbackRedirectUrl="/" forceRedirectUrl="/">
            <button
              type="button"
              className="inline-flex h-12 items-center justify-center rounded-full bg-blue-600 px-6 text-sm font-semibold text-white transition-colors shadow-[0_12px_30px_rgba(37,99,235,0.28)] hover:bg-blue-700"
            >
              {copy.cta}
            </button>
          </SignInButton>
        </div>
      </div>
    </section>
  );
}

function ClerkAwareHome() {
  const { isLoaded, isSignedIn } = useUser();

  if (isLoaded && isSignedIn) {
    return <Chat clerkEnabled />;
  }

  return <LuAiSignInScreen />;
}

export function HomeClient({ clerkEnabled }: { clerkEnabled: boolean }) {
  if (!clerkEnabled) {
    return <Chat clerkEnabled={false} />;
  }

  return <ClerkAwareHome />;
}
