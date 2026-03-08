import type { AssistantAvatarPreset } from './avatar-config';

export interface UsageSummary {
  username: string;
  totalRequests: number;
  totalQuotes: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  last30DaysTokens: number;
  last30DaysRequests: number;
  dailyUsage: Array<{ day: string; totalTokens: number; requests: number }>;
  recentEvents: Array<{
    id: string;
    createdAt: string;
    model: string;
    locale: string;
    sessionId: string | null;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  }>;
}

export interface ProfileSummary {
  username: string;
  displayName: string;
}

export interface ProfileUiSettings {
  showUsageSummary: boolean;
  showDailyUsageChart: boolean;
  showRecentTokenEvents: boolean;
}

export interface ProfileAvatarSettings {
  globalAssistantPreset: AssistantAvatarPreset;
  assistant: {
    mode: 'default' | 'preset' | 'custom';
    imageUrl: string | null;
  };
  user: {
    mode: 'default' | 'custom';
    imageUrl: string | null;
  };
}

export interface ProfileResponse {
  profile: ProfileSummary;
  usage: UsageSummary;
  uiSettings: ProfileUiSettings;
  avatarSettings: ProfileAvatarSettings;
}
