import { AppLocale } from '@/lib/i18n';
import { FLOW_CARD_IDS, type FlowCardId } from '@/lib/platform/cards';
import { resolveCardSystemPromptForLocale } from '@/lib/platform/card-system-prompts';
import { getEnabledToolPromptsForCard } from '@/lib/platform/tool-prompts';

const BASE_SYSTEM_PROMPTS: Record<AppLocale, string> = {
  es: `Eres un asistente conversacional para una plataforma de flujos configurables por cards.

REGLAS GLOBALES:
- Nunca muestres JSON, datos técnicos, arrays u objetos internos.
- Habla de forma clara, profesional y breve.
- Usa únicamente herramientas disponibles en esta ejecución.
- Nunca prometas formularios o widgets si el flujo correspondiente no está activo.
- Si no hay un flujo activo para la solicitud, dilo claramente y sugiere activar el card en configuración.`,
  en: `You are a conversational assistant for a platform with configurable card-based flows.

GLOBAL RULES:
- Never expose JSON, technical payloads, arrays, or internal objects.
- Keep responses clear, professional, and concise.
- Use only tools available in the current execution.
- Never promise forms or widgets when the related flow is not active.
- If no active flow matches the request, say so clearly and suggest enabling the card in settings.`,
};

const NO_FLOWS_ENABLED_PROMPT: Record<AppLocale, string> = {
  es: `No hay cards activos. No ofrezcas cotización, formularios ni widgets.
Si el usuario pide un flujo especializado, responde que no está habilitado actualmente y que debe activarse en configuración.`,
  en: `There are no active cards. Do not offer quotes, forms, or widgets.
If the user asks for a specialized flow, explain it is currently disabled and must be enabled in settings.`,
};

function getEnabledFlowPromptSections(
  locale: AppLocale,
  enabledCardIds: Set<FlowCardId>,
  cardConfigById?: Partial<Record<FlowCardId, Record<string, unknown>>>
): string[] {
  if (enabledCardIds.size === 0) {
    return [NO_FLOWS_ENABLED_PROMPT[locale]];
  }

  const sections: string[] = [];
  for (const cardId of FLOW_CARD_IDS) {
    if (!enabledCardIds.has(cardId)) continue;
    const localizedPrompt = resolveCardSystemPromptForLocale({
      cardId,
      cardConfig: cardConfigById?.[cardId],
      locale,
    });
    sections.push(localizedPrompt);
  }

  return sections;
}

function getAdminToolPromptSection(params: {
  locale: AppLocale;
  enabledCardIds: Set<FlowCardId>;
  cardConfigById?: Partial<Record<FlowCardId, Record<string, unknown>>>;
}): string | null {
  const { locale, enabledCardIds, cardConfigById } = params;
  if (!cardConfigById) return null;

  const lines: string[] = [];
  for (const cardId of enabledCardIds) {
    const prompts = getEnabledToolPromptsForCard(cardId, cardConfigById[cardId], locale);
    for (const [toolId, prompt] of Object.entries(prompts)) {
      lines.push(`- ${cardId}.${toolId}: ${prompt}`);
    }
  }

  if (lines.length === 0) return null;

  const heading =
    locale === 'en'
      ? 'ADMIN TOOL INSTRUCTIONS (apply only when using each tool):'
      : 'INSTRUCCIONES ADMIN POR HERRAMIENTA (aplican solo al usar cada herramienta):';

  return `${heading}\n${lines.join('\n')}`;
}

export function buildSystemPrompt(params: {
  locale: AppLocale;
  enabledCardIds: Set<FlowCardId>;
  cardConfigById?: Partial<Record<FlowCardId, Record<string, unknown>>>;
}): string {
  const { locale, enabledCardIds, cardConfigById } = params;

  const flowSections = getEnabledFlowPromptSections(locale, enabledCardIds, cardConfigById);
  const adminToolPromptSection = getAdminToolPromptSection({
    locale,
    enabledCardIds,
    cardConfigById,
  });
  return [BASE_SYSTEM_PROMPTS[locale], ...flowSections, adminToolPromptSection]
    .filter((section): section is string => !!section)
    .join('\n\n');
}
