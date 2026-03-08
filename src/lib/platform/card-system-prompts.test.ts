import { describe, expect, it } from 'vitest';
import {
  CARD_SYSTEM_PROMPT_MAX_LENGTH,
  DEFAULT_CARD_SYSTEM_PROMPTS,
  isValidCardSystemPromptByLocale,
  resolveCardSystemPromptForLocale,
  resolveCardSystemPromptByLocale,
} from './card-system-prompts';

describe('platform card system prompts', () => {
  it('resolves configured localized prompts with fallback to defaults', () => {
    const resolved = resolveCardSystemPromptByLocale('weather_forecast', {
      systemPromptByLocale: {
        es: '  Prompt ES  ',
        pt: '  Prompt PT  ',
      },
    });

    expect(resolved.es).toBe('Prompt ES');
    expect(resolved.en).toBe(DEFAULT_CARD_SYSTEM_PROMPTS.weather_forecast.en);
    expect(resolved.pt).toBe('Prompt PT');
  });

  it('falls back to legacy systemPrompt string when localized field is missing', () => {
    const resolved = resolveCardSystemPromptByLocale('weather_forecast', {
      systemPrompt: 'legacy prompt',
    });

    expect(resolved.es).toBe('legacy prompt');
    expect(resolved.en).toBe('legacy prompt');
  });

  it('validates localized prompts and rejects malformed values', () => {
    expect(
      isValidCardSystemPromptByLocale({
        es: 'uno',
        en: 'two',
      })
    ).toBe(true);
    expect(isValidCardSystemPromptByLocale({ es: 'uno' })).toBe(false);
    expect(isValidCardSystemPromptByLocale({ es: '', en: 'x' })).toBe(false);
    expect(isValidCardSystemPromptByLocale('invalid')).toBe(false);
  });

  it('truncates oversized configured prompts to the max length', () => {
    const resolved = resolveCardSystemPromptByLocale('weather_forecast', {
      systemPromptByLocale: {
        es: 'x'.repeat(CARD_SYSTEM_PROMPT_MAX_LENGTH + 20),
        en: 'y'.repeat(CARD_SYSTEM_PROMPT_MAX_LENGTH + 20),
      },
    });

    expect(resolved.es).toHaveLength(CARD_SYSTEM_PROMPT_MAX_LENGTH);
    expect(resolved.en).toHaveLength(CARD_SYSTEM_PROMPT_MAX_LENGTH);
  });

  it('resolves locale-specific prompt using language fallback', () => {
    const resolvedPtBr = resolveCardSystemPromptForLocale({
      cardId: 'weather_forecast',
      cardConfig: {
        systemPromptByLocale: {
          es: 'Prompt clima ES',
          en: 'Weather prompt EN',
          pt: 'Prompt clima PT',
        },
      },
      locale: 'pt-BR',
    });
    const resolvedFr = resolveCardSystemPromptForLocale({
      cardId: 'weather_forecast',
      cardConfig: {
        systemPromptByLocale: {
          es: 'Prompt clima ES',
          en: 'Weather prompt EN',
        },
      },
      locale: 'fr',
    });

    expect(resolvedPtBr).toBe('Prompt clima PT');
    expect(resolvedFr).toBe('Weather prompt EN');
  });

  it('falls back to spanish default prompt when locale cannot be resolved', () => {
    const resolved = resolveCardSystemPromptForLocale({
      cardId: 'weather_forecast',
      cardConfig: {
        systemPromptByLocale: {
          fr: 'Prompt FR',
        },
      },
      locale: 'de-DE',
    });

    expect(resolved).toBe(DEFAULT_CARD_SYSTEM_PROMPTS.weather_forecast.en);
    expect(
      resolveCardSystemPromptByLocale('weather_forecast', {
        systemPromptByLocale: [],
        systemPrompt: '   ',
      } as never)
    ).toEqual({
      es: DEFAULT_CARD_SYSTEM_PROMPTS.weather_forecast.es,
      en: DEFAULT_CARD_SYSTEM_PROMPTS.weather_forecast.en,
    });
  });

  it('rejects localized prompt maps without both es and en after sanitization', () => {
    expect(
      isValidCardSystemPromptByLocale({
        ' ES ': 'hola',
        en: '   ',
        pt: 'oi',
      })
    ).toBe(false);
  });
});
