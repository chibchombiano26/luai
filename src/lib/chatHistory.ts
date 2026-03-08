import { AppLocale } from '@/lib/i18n';
import {
  getCompatStorageItem,
  setCompatStorageItem,
} from './browser-storage';
import {
  LEGACY_ACTIVE_CHAT_SESSION_ID_STORAGE_KEYS,
  LEGACY_CHAT_SESSIONS_STORAGE_KEYS,
  LEGACY_CHAT_TOOL_TYPE_ALIASES,
} from './legacy-compat';

export interface QuoteCoverageSnapshot {
  Description?: string;
  DeclaredAmount?: number;
  Deductible?: string;
  PremiumAmount?: number;
}

export interface QuotePayload {
  SummaryQuote?: Record<string, unknown>;
  DetailQuotations?: Array<{
    DetailRisk?: {
      ProcessMessage?: string;
      DetailPolicy?: Record<string, unknown>;
      DetailInsuredObjects?: Array<{
        Coverages?: QuoteCoverageSnapshot[];
      }>;
    };
    FlowVariant?: string;
    FlowId?: string;
  }>;
  InsuredName?: string;
  InsuredSurname?: string;
  licensePlate?: string;
  [key: string]: unknown;
}

export interface QuoteHistoryItem {
  id: string;
  temp_id: string;
  quote_data?: string;
  created_at: string;
  plate_number?: string;
  total?: number;
}

export interface ComparisonQuotation {
  CoverGroup: string;
  Product: string;
  Total?: number;
  DetailQuotations?: Array<{
    CoverGroup: string;
    Product: string;
    CoveragePremium?: number;
  }>;
  ProcessMessage?: string;
}

export interface PaymentCoverage {
  name: string;
  amount: number;
  premium: number;
}

export interface RecommendationItem {
  title: string;
  reason: string;
  priority: 'recommended' | 'optional';
}

export interface InsurerComparisonProvider {
  providerCode: string;
  providerName: string;
  planName?: string;
  annualPremium?: number;
  monthlyPremium?: number;
  status: 'available' | 'warning' | 'coming_soon';
  source: 'live' | 'sample' | 'mock';
  quoteReference?: string;
  coverageHighlights?: string[];
  message?: string;
  providerDetails?: Array<{
    title: string;
    items: Array<{
      label: string;
      value: string;
    }>;
  }>;
  planOptions?: Array<{
    planCode?: string;
    planName: string;
    annualPremium?: number;
    monthlyPremium?: number;
    status: 'available' | 'warning' | 'coming_soon';
    source?: 'live' | 'sample' | 'mock';
    quoteReference?: string;
    message?: string;
    coverageHighlights?: string[];
    providerDetails?: Array<{
      title: string;
      items: Array<{
        label: string;
        value: string;
      }>;
    }>;
    detailQuote?: QuotePayload;
    supportsPdf?: boolean;
  }>;
  detailQuote?: QuotePayload;
  supportsPdf?: boolean;
}

export type ChatToolType =
  | 'vehicle_form'
  | 'owner_form'
  | 'quote'
  | 'error'
  | 'premium_breakdown'
  | 'coverage_details'
  | 'vehicle_info'
  | 'guidance_tips'
  | 'recommendations'
  | 'discounts'
  | 'quote_history'
  | 'payment_summary'
  | 'comparison'
  | 'insurer_comparison'
  | 'quote_calculator'
  | 'weather_forecast'
  | 'dynamic_card';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Tip {
  title: string;
  content: string;
  icon?: string;
}

export interface Discount {
  name: string;
  description: string;
  estimatedSaving: number;
  applicable: boolean;
}

export type ChatToolData =
  | {
      type: 'vehicle_form';
      data: {
        message: string;
        prefill?: {
          licensePlate?: string;
          vehicleYear?: number;
          fasecoldaCode?: string;
          vehiclePrice?: number;
          isNew?: boolean;
          mode?: 'quote' | 'insurer_comparison';
        };
      };
    }
  | {
      type: 'owner_form';
      data: {
        message: string;
        vehicleData: {
          licensePlate: string;
          fasecoldaCode: string;
          vehicleYear: number;
          vehiclePrice: number;
          isNew: boolean;
          mode?: 'quote' | 'insurer_comparison';
        };
      };
    }
  | {
      type: 'quote';
      data: {
        quote: QuotePayload;
        licensePlate?: string;
        providerCode?: string;
        supportsPdf?: boolean;
      };
    }
  | {
      type: 'error';
      data: {
        message: string;
      };
    }
  | {
      type: 'premium_breakdown';
      data: {
        premiumAmount: number;
        taxAmount: number;
        totalWithTax: number;
        licensePlate: string;
      };
    }
  | {
      type: 'coverage_details';
      data: {
        coverages: Array<{
          name: string;
          amount: number;
          deductible: number;
          premium: number;
        }>;
        licensePlate: string;
      };
    }
  | {
      type: 'vehicle_info';
      data: {
        licensePlate: string;
        vehicleYear: number;
        fasecoldaCode: string;
        vehiclePrice: number;
        ratingZoneCode: number;
        isNew?: boolean;
      };
    }
  | {
      type: 'guidance_tips';
      data: {
        tips: Tip[];
      };
    }
  | {
      type: 'recommendations';
      data: {
        vehicleYear: number;
        vehiclePrice: number;
        recommendations: RecommendationItem[];
      };
    }
  | {
      type: 'discounts';
      data: {
        discounts: Discount[];
      };
    }
  | {
      type: 'quote_history';
      data: {
        quotes: QuoteHistoryItem[];
      };
    }
  | {
      type: 'payment_summary';
      data: {
        tempId: string;
        totalWithTax: number;
        coverages: PaymentCoverage[];
        licensePlate: string;
        insuredName: string;
        daysValidate: number;
      };
    }
  | {
      type: 'comparison';
      data: {
        quotations: ComparisonQuotation[];
        licensePlate: string;
      };
    }
  | {
      type: 'insurer_comparison';
      data: {
        requestId?: string;
        partial?: boolean;
        licensePlate: string;
        providers: InsurerComparisonProvider[];
      };
    }
  | {
      type: 'quote_calculator';
      data: {
        vehicleYear: number;
        vehiclePrice: number;
        ratingZoneCode: number;
      };
    }
  | {
      type: 'weather_forecast';
      data: {
        locationName: string;
        timezone: string;
        latitude: number;
        longitude: number;
        units: 'metric' | 'imperial';
        summary: string;
        current: {
          time: string;
          weatherCode: number;
          weatherLabel: string;
          temperature: number;
          apparentTemperature: number;
          windSpeed: number;
        };
        daily: Array<{
          date: string;
          weatherCode: number;
          weatherLabel: string;
          tempMax: number;
          tempMin: number;
          precipitationProbabilityMax?: number;
          sunrise?: string;
          sunset?: string;
          selected?: boolean;
        }>;
      };
    }
  | {
      type: 'dynamic_card';
      data: {
        cardId: string;
        title: string;
        description?: string;
        message?: string;
        details?: Array<{
          label: string;
          value: string;
        }>;
      };
    };

export type ChatToolMessage = {
  id: string;
  timestamp: number;
} & ChatToolData;

export interface ChatSession {
  id: string;
  title: string;
  locale: AppLocale;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  toolMessages: ChatToolMessage[];
  closedToolIds: string[];
}

const CHAT_SESSIONS_KEY = 'luai_chat_sessions_v1';
const LEGACY_CHAT_SESSIONS_KEYS = LEGACY_CHAT_SESSIONS_STORAGE_KEYS;
const ACTIVE_CHAT_SESSION_ID_KEY = 'luai_active_chat_session_id';
const LEGACY_ACTIVE_CHAT_SESSION_ID_KEYS = LEGACY_ACTIVE_CHAT_SESSION_ID_STORAGE_KEYS;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toNumber(value: unknown, fallback = Date.now()): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function toString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export function normalizeChatToolType(value: unknown): ChatToolType | null {
  const normalized = toString(value);

  if (normalized in LEGACY_CHAT_TOOL_TYPE_ALIASES) {
    return LEGACY_CHAT_TOOL_TYPE_ALIASES[
      normalized as keyof typeof LEGACY_CHAT_TOOL_TYPE_ALIASES
    ];
  }

  switch (normalized) {
    case 'vehicle_form':
    case 'owner_form':
    case 'quote':
    case 'error':
    case 'premium_breakdown':
    case 'coverage_details':
    case 'vehicle_info':
    case 'guidance_tips':
    case 'recommendations':
    case 'discounts':
    case 'quote_history':
    case 'payment_summary':
    case 'comparison':
    case 'insurer_comparison':
    case 'quote_calculator':
    case 'weather_forecast':
    case 'dynamic_card':
      return normalized;
    default:
      return null;
  }
}

function normalizeMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .map((item) => ({
      id: toString(item.id, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content: toString(item.content),
      timestamp: toNumber(item.timestamp),
    }));
}

function normalizeToolMessages(value: unknown): ChatToolMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(isRecord)
    .map((item) => {
      const toolType = normalizeChatToolType(item.type);
      if (!toolType) return null;

      return {
        id: toString(item.id, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
        type: toolType,
        data: isRecord(item.data) ? item.data : {},
        timestamp: toNumber(item.timestamp),
      };
    })
    .filter((item): item is ChatToolMessage => item !== null);
}

function normalizeClosedToolIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

export function createChatSession(locale: AppLocale): ChatSession {
  const now = Date.now();
  return {
    id: `chat_${now}_${Math.random().toString(36).slice(2, 8)}`,
    title: locale === 'es' ? 'Nueva conversacion' : 'New conversation',
    locale,
    createdAt: now,
    updatedAt: now,
    messages: [],
    toolMessages: [],
    closedToolIds: [],
  };
}

export function getChatSessions(): ChatSession[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = getCompatStorageItem(localStorage, CHAT_SESSIONS_KEY, LEGACY_CHAT_SESSIONS_KEYS);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(isRecord)
      .map((item) => {
        const createdAt = toNumber(item.createdAt);
        const updatedAt = toNumber(item.updatedAt, createdAt);
        const locale: AppLocale = item.locale === 'en' ? 'en' : 'es';
        return {
          id: toString(item.id, `chat_${createdAt}`),
          title: toString(
            item.title,
            locale === 'es' ? 'Nueva conversacion' : 'New conversation'
          ),
          locale,
          createdAt,
          updatedAt,
          messages: normalizeMessages(item.messages),
          toolMessages: normalizeToolMessages(item.toolMessages),
          closedToolIds: normalizeClosedToolIds(item.closedToolIds),
        };
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function saveChatSessions(sessions: ChatSession[]): void {
  if (typeof window === 'undefined') return;

  try {
    setCompatStorageItem(
      localStorage,
      CHAT_SESSIONS_KEY,
      JSON.stringify(sessions),
      LEGACY_CHAT_SESSIONS_KEYS
    );
  } catch {
    // Ignore storage failures.
  }
}

export function getActiveChatSessionId(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return getCompatStorageItem(
      localStorage,
      ACTIVE_CHAT_SESSION_ID_KEY,
      LEGACY_ACTIVE_CHAT_SESSION_ID_KEYS
    );
  } catch {
    return null;
  }
}

export function saveActiveChatSessionId(sessionId: string): void {
  if (typeof window === 'undefined') return;

  try {
    setCompatStorageItem(
      localStorage,
      ACTIVE_CHAT_SESSION_ID_KEY,
      sessionId,
      LEGACY_ACTIVE_CHAT_SESSION_ID_KEYS
    );
  } catch {
    // Ignore storage failures.
  }
}
