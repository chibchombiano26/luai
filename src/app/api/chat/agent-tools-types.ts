export type FlowPackProviderCode = string;

export interface ToolContext {
  isEnglish: boolean;
  detectedPlate: string | null;
  abortSignal?: AbortSignal;
  onQuoteGenerated?: () => void;
  actorUserId?: string | null;
  enabledCardIds?: ReadonlySet<string>;
  cardConfigById?: Record<string, Record<string, unknown>>;
  enabledComparisonProviderCodes?: FlowPackProviderCode[];
  enabledSingleProviderCodes?: FlowPackProviderCode[];
}
