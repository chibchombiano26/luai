import { AppLocale } from '@/lib/i18n';
import { AccentTheme } from '@/lib/theme';
import { ChatMessage } from '@/lib/chatHistory';
import { LEGACY_LOCALE_STORAGE_KEYS as LEGACY_LOCALE_STORAGE_KEYS_COMPAT } from '@/lib/legacy-compat';

export const LOCALE_STORAGE_KEY = 'luai_locale';
export const LEGACY_LOCALE_STORAGE_KEYS = LEGACY_LOCALE_STORAGE_KEYS_COMPAT;
export const MAX_CHAT_SESSIONS = 30;
export const MAX_INPUT_LINES = 4;
export const AUTO_SUBMIT_DELAY_SECONDS = 2;
export const VOICE_AUTO_SUBMIT_DELAY_SECONDS = 5;

export function formatSessionDate(timestamp: number, locale: AppLocale) {
  const localeTag = locale === 'en' ? 'en-US' : 'es-CO';
  return new Date(timestamp).toLocaleString(localeTag, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function deriveSessionTitle(messages: ChatMessage[], locale: AppLocale): string {
  const firstUserMessage = messages.find((message) => message.role === 'user' && message.content.trim());
  if (!firstUserMessage) {
    return locale === 'en' ? 'New conversation' : 'Nueva conversacion';
  }

  const normalized = firstUserMessage.content.replace(/\s+/g, ' ').trim();
  const maxLength = 42;
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
}

export function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

export function buildCommandMessage(prompt: string, remainder: string): string {
  return remainder ? `${prompt}: ${remainder}` : prompt;
}

export const CHAT_COPY: Record<
  AppLocale,
  {
    loading: string;
    title: string;
    online: string;
    admin: string;
    newChat: string;
    emptyTitle: string;
    emptySubtitle: string;
    placeholder: string;
    errorProcessing: string;
    overridesBanner: string;
    lightMode: string;
    darkMode: string;
    profile: string;
    menu: string;
    colorPalette: string;
    conversationHistory: string;
    noConversations: string;
    deleteConversation: string;
    adminConfigTitle: string;
    autoSubmitIn: (seconds: number) => string;
    cancelAutoSubmit: string;
    apiLookupInProgress: string;
    authRequired: string;
    voiceStart: string;
    voiceStop: string;
    stopRequest: string;
    voiceListening: string;
    voiceError: string;
    login: string;
    logout: string;
  }
> = {
  es: {
    loading: 'Cargando chat...',
    title: 'LuAI',
    online: 'En línea',
    admin: 'Admin',
    newChat: 'Nuevo',
    emptyTitle: '¡Hola! Soy tu asistente.',
    emptySubtitle: 'Escribe un mensaje para comenzar.',
    placeholder: 'Escribe tu mensaje aquí...',
    errorProcessing: 'Error: No se pudo procesar tu mensaje. Por favor intenta de nuevo.',
    overridesBanner: '⚙️ Hay overrides activos en el payload.',
    lightMode: 'Cambiar a claro',
    darkMode: 'Cambiar a oscuro',
    profile: 'Perfil',
    menu: 'Menu',
    colorPalette: 'Paleta',
    conversationHistory: 'Historial',
    noConversations: 'Aun no hay conversaciones',
    deleteConversation: 'Eliminar conversacion',
    adminConfigTitle: 'Configuracion de payload',
    autoSubmitIn: (seconds) => `Enviando automaticamente en ${seconds}s...`,
    cancelAutoSubmit: 'Cancelar',
    apiLookupInProgress: 'Consultando multiples aseguradoras...',
    authRequired: 'Tu sesión no está disponible. Inicia sesión nuevamente desde el botón de acceso.',
    voiceStart: 'Iniciar dictado por voz',
    voiceStop: 'Detener dictado por voz',
    stopRequest: 'Detener solicitud',
    voiceListening: 'Escuchando...',
    voiceError: 'No se pudo iniciar el dictado por voz. Verifica permisos del microfono.',
    login: 'Ingresar',
    logout: 'Salir',
  },
  en: {
    loading: 'Loading chat...',
    title: 'LuAI',
    online: 'Online',
    admin: 'Admin',
    newChat: 'New',
    emptyTitle: 'Hi! I am your assistant.',
    emptySubtitle: 'Type a message to get started.',
    placeholder: 'Type your message here...',
    errorProcessing: 'Error: Unable to process your message. Please try again.',
    overridesBanner: '⚙️ Payload overrides are active.',
    lightMode: 'Switch to light mode',
    darkMode: 'Switch to dark mode',
    profile: 'Profile',
    menu: 'Menu',
    colorPalette: 'Palette',
    conversationHistory: 'History',
    noConversations: 'No conversations yet',
    deleteConversation: 'Delete conversation',
    adminConfigTitle: 'Payload configuration',
    autoSubmitIn: (seconds) => `Auto-sending in ${seconds}s...`,
    cancelAutoSubmit: 'Cancel',
    apiLookupInProgress: 'Consulting multiple insurers...',
    authRequired: 'Your session is not available. Sign in again from the login button.',
    voiceStart: 'Start voice dictation',
    voiceStop: 'Stop voice dictation',
    stopRequest: 'Stop request',
    voiceListening: 'Listening...',
    voiceError: 'Could not start voice dictation. Check microphone permissions.',
    login: 'Login',
    logout: 'Logout',
  },
};

export const ACCENT_THEME_LABELS: Record<AppLocale, Record<AccentTheme, string>> = {
  es: {
    blue: 'Azul',
    emerald: 'Esmeralda',
    rose: 'Rosa',
    amber: 'Ambar',
    violet: 'Violeta',
    cyan: 'Cian',
    indigo: 'Indigo',
    teal: 'Turquesa',
  },
  en: {
    blue: 'Blue',
    emerald: 'Emerald',
    rose: 'Rose',
    amber: 'Amber',
    violet: 'Violet',
    cyan: 'Cyan',
    indigo: 'Indigo',
    teal: 'Teal',
  },
};

export const ACCENT_THEME_SWATCHES: Record<AccentTheme, string> = {
  blue: '#2563eb',
  emerald: '#059669',
  rose: '#e11d48',
  amber: '#d97706',
  violet: '#7c3aed',
  cyan: '#0891b2',
  indigo: '#4f46e5',
  teal: '#0f766e',
};
