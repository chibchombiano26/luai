'use client';

import { useRef, useState, useEffect, CSSProperties } from 'react';
import { Bot, AlertCircle, History, ChevronDown, Trash2, Settings, UserCircle2, Moon, Sun, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { UserButton, useUser } from '@clerk/nextjs';
import { AppLocale } from '@/lib/i18n';
import { ChatSession } from '@/lib/chatHistory';
import { AccentTheme, ACCENT_THEMES } from '@/lib/theme';
import { isAdminRole, resolveAppUserRoleFromMetadata } from '@/lib/access/roles';
import {
  CHAT_COPY,
  ACCENT_THEME_LABELS,
  ACCENT_THEME_SWATCHES,
  formatSessionDate,
} from './chat-constants';

interface ChatHeaderProps {
  clerkEnabled: boolean;
  locale: AppLocale;
  changeLocale: (l: AppLocale) => void;
  sessions: ChatSession[];
  activeSessionId: string;
  switchConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  startNewConversation: () => void;
  hasOverrides: boolean;
  accentTheme: AccentTheme;
  setAccentTheme: (t: AccentTheme) => void;
  theme: string | undefined;
  toggleTheme: () => void;
  themeMounted: boolean;
  showNewChatButton: boolean;
}

function BrandIdentity({
  title,
  onlineLabel,
  leading,
}: {
  title: string;
  onlineLabel: string;
  leading: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      {leading}
      <div>
        <h1 className="font-bold dark:text-white">{title}</h1>
        <p className="text-xs text-zinc-500 flex items-center gap-1">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          {onlineLabel}
        </p>
      </div>
    </div>
  );
}

function ClerkBrandIdentity({ title, onlineLabel }: { title: string; onlineLabel: string }) {
  const { isLoaded, isSignedIn } = useUser();
  const robotIcon = (
    <div className="w-9 h-9 md:w-10 md:h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
      <Bot className="w-6 h-6" />
    </div>
  );

  if (!isLoaded || !isSignedIn) {
    return <BrandIdentity title={title} onlineLabel={onlineLabel} leading={robotIcon} />;
  }

  return (
    <BrandIdentity
      title={title}
      onlineLabel={onlineLabel}
      leading={
        <div className="h-9 md:h-10 flex items-center px-1 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800">
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: 'w-7 h-7 md:w-8 md:h-8',
              },
            }}
          />
        </div>
      }
    />
  );
}

function ClerkAdminMenuLink({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  const role = resolveAppUserRoleFromMetadata(user?.publicMetadata);
  if (!isAdminRole(role)) {
    return null;
  }

  return (
    <Link
      href="/admin"
      onClick={onClick}
      className="flex items-center gap-2 w-full rounded-lg px-2 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
    >
      <Settings className="w-4 h-4" />
      <span>{label}</span>
    </Link>
  );
}

export function ChatHeader({
  clerkEnabled,
  locale,
  changeLocale,
  sessions,
  activeSessionId,
  switchConversation,
  deleteConversation,
  startNewConversation,
  hasOverrides,
  accentTheme,
  setAccentTheme,
  theme,
  toggleTheme,
  themeMounted,
  showNewChatButton,
}: ChatHeaderProps) {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [historyMenuStyle, setHistoryMenuStyle] = useState<CSSProperties | undefined>(undefined);
  
  const paletteRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const historyButtonRef = useRef<HTMLButtonElement>(null);

  const t = CHAT_COPY[locale];
  const hasClerk = clerkEnabled;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) setIsPaletteOpen(false);
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) setIsHistoryOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!isHistoryOpen) return;
    const updatePos = () => {
      if (!historyButtonRef.current) return;
      const rect = historyButtonRef.current.getBoundingClientRect();
      const menuWidth = window.innerWidth >= 768 ? 288 : Math.min(288, window.innerWidth - 16);
      const top = rect.bottom + 8;
      const left = Math.max(8, Math.min(rect.left + rect.width / 2 - menuWidth / 2, window.innerWidth - menuWidth - 8));
      setHistoryMenuStyle({ top, left, width: menuWidth });
    };
    updatePos();
    window.addEventListener('resize', updatePos);
    return () => window.removeEventListener('resize', updatePos);
  }, [isHistoryOpen, sessions.length, locale]);

  return (
    <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      {hasOverrides && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-3 md:px-6 py-2 flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{t.overridesBanner}</span>
        </div>
      )}

      <div className="p-3 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {hasClerk ? (
          <ClerkBrandIdentity title={t.title} onlineLabel={t.online} />
        ) : (
          <BrandIdentity
            title={t.title}
            onlineLabel={t.online}
            leading={
              <div className="w-9 h-9 md:w-10 md:h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
                <Bot className="w-6 h-6" />
              </div>
            }
          />
        )}
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Locale Toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-zinc-300 dark:border-zinc-700 p-1">
            <button
              onClick={() => changeLocale('es')}
              className={`px-2 py-1 text-xs rounded ${locale === 'es' ? 'bg-blue-600 text-white' : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
            >ES</button>
            <button
              onClick={() => changeLocale('en')}
              className={`px-2 py-1 text-xs rounded ${locale === 'en' ? 'bg-blue-600 text-white' : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
            >EN</button>
          </div>

          {/* History */}
          <div ref={historyRef} className="relative">
            <button
              ref={historyButtonRef}
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              aria-label={t.conversationHistory}
              className="h-8 px-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center gap-1.5 text-zinc-700 dark:text-zinc-200"
            >
              <History className="w-4 h-4" />
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {isHistoryOpen && (
              <div 
                role="menu" 
                aria-label="historial menu"
                className="fixed z-20 max-h-[60dvh] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg p-2 space-y-2 overflow-y-auto" 
                style={historyMenuStyle}
              >
                <button onClick={() => { startNewConversation(); setIsHistoryOpen(false); }} className="w-full text-left px-2 py-1.5 text-sm rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200">{t.newChat}</button>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {sessions.length === 0 ? <p className="px-2 py-2 text-sm text-zinc-500">{t.noConversations}</p> : sessions.map(s => (
                    <div key={s.id} className={`w-full text-left px-2 py-2 rounded-lg border transition-colors ${s.id === activeSessionId ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
                      <div className="flex items-start gap-2">
                        <button onClick={() => { switchConversation(s.id); setIsHistoryOpen(false); }} className="flex-1 text-left min-w-0">
                          <p className="text-xs text-zinc-500">{formatSessionDate(s.updatedAt, locale)}</p>
                          <p className="text-sm truncate text-zinc-700 dark:text-zinc-200">{s.title}</p>
                        </button>
                        {(s.messages.length > 0 || s.toolMessages.length > 0) && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteConversation(s.id); }} 
                            aria-label={`${t.deleteConversation} ${s.title}`}
                            className="mt-0.5 p-1 rounded-md text-zinc-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Palette */}
          <div ref={paletteRef} className="relative">
            <button 
              onClick={() => setIsPaletteOpen(!isPaletteOpen)} 
              aria-label={t.colorPalette}
              className="h-8 px-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center gap-1.5"
            >
              <span className="w-4 h-4 rounded-full border border-zinc-300/70" style={{ backgroundColor: ACCENT_THEME_SWATCHES[accentTheme] }} />
              <ChevronDown className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
            </button>
            {isPaletteOpen && (
              <div 
                role="menu"
                aria-label="paleta menu"
                className="absolute right-0 mt-2 z-20 w-36 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg p-2"
              >
                <div className="grid grid-cols-4 gap-1.5 justify-items-center">
                  {ACCENT_THEMES.map(p => (
                    <button 
                      key={p} 
                      onClick={() => { setAccentTheme(p); setIsPaletteOpen(false); }} 
                      aria-label={`${t.colorPalette} ${ACCENT_THEME_LABELS[locale][p]}`}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${accentTheme === p ? 'border-zinc-900 dark:border-white scale-110' : 'border-transparent hover:scale-105'}`} 
                      style={{ backgroundColor: ACCENT_THEME_SWATCHES[p] }} 
                      title={ACCENT_THEME_LABELS[locale][p]} 
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          {themeMounted && (
            <button
              onClick={toggleTheme}
              aria-label={theme === 'light' ? t.darkMode : t.lightMode}
              title={theme === 'light' ? t.darkMode : t.lightMode}
              className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-zinc-700 rounded-lg text-gray-800 dark:text-zinc-200"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          )}

	          {/* User Menu */}
	          <div ref={menuRef} className="relative">
	            <button 
	              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              aria-label={t.menu}
              className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center"
            >
              <Settings className="w-4 h-4" />
            </button>
            {isMenuOpen && (
              <div 
                role="menu"
                aria-label="menu dropdown"
                className="absolute right-0 mt-2 z-20 w-44 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg p-1.5"
	              >
	                <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 w-full rounded-lg px-2 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800">
	                  <UserCircle2 className="w-4 h-4" />
	                  <span>{t.profile}</span>
	                </Link>
                  {hasClerk ? (
                    <ClerkAdminMenuLink label={t.admin} onClick={() => setIsMenuOpen(false)} />
                  ) : (
                    <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 w-full rounded-lg px-2 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                      <Settings className="w-4 h-4" />
                      <span>{t.admin}</span>
                    </Link>
                  )}
	              </div>
	            )}
	          </div>
          {/* New Chat Button */}
          {showNewChatButton && (
            <button
              onClick={startNewConversation}
              aria-label={t.newChat}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">{t.newChat}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
