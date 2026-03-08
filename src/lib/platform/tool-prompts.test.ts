import { describe, expect, it } from 'vitest';
import {
  FLOW_TOOL_IDS_BY_CARD,
  getEnabledToolPromptsForCard,
  getToolPromptsByLocaleForCard,
  getToolIdsForCard,
  isFlowToolId,
  resolveLocalizedToolPrompt,
  resolveToolPromptForLocale,
  sanitizeToolPromptValue,
  TOOL_PROMPT_MAX_LENGTH,
} from './tool-prompts';

describe('platform tool prompts', () => {
  it('returns tool ids per card', () => {
    expect(getToolIdsForCard('weather_forecast')).toEqual(['show_weather_forecast']);
  });

  it('validates flow tool ids', () => {
    expect(isFlowToolId('show_weather_forecast')).toBe(true);
    expect(isFlowToolId('unknown_tool')).toBe(false);
  });

  it('sanitizes prompt values and truncates by max length', () => {
    expect(sanitizeToolPromptValue('  hola  ')).toBe('hola');
    expect(sanitizeToolPromptValue('')).toBeNull();
    expect(sanitizeToolPromptValue(123)).toBeNull();
    expect(sanitizeToolPromptValue('x'.repeat(TOOL_PROMPT_MAX_LENGTH + 8))).toHaveLength(
      TOOL_PROMPT_MAX_LENGTH
    );
  });

  it('filters tool prompts by card and ignores unknown tool ids', () => {
    const prompts = getEnabledToolPromptsForCard('weather_forecast', {
      toolPrompts: {
        show_weather_forecast: {
          es: 'prioriza el resumen diario',
          en: 'prioritize the daily summary',
          pt: 'priorize o resumo diario',
        },
        unrelated_tool: 'no deberia aplicar en este card',
        unknown_tool: 'ignorar',
      },
    }, 'es');

    expect(prompts.show_weather_forecast).toBe('prioriza el resumen diario');
    expect(prompts).not.toHaveProperty('unrelated_tool');
    expect(prompts).not.toHaveProperty('unknown_tool');
  });

  it('supports localized tool prompts with locale fallback', () => {
    const localized = resolveLocalizedToolPrompt({
      es: 'prompt es',
      en: 'prompt en',
      pt: 'prompt pt',
    });
    expect(resolveToolPromptForLocale(localized, 'pt-BR')).toBe('prompt pt');
    expect(resolveToolPromptForLocale(localized, 'fr')).toBe('prompt en');
  });

  it('ignores invalid localized values and falls back to first available prompt', () => {
    const localized = resolveLocalizedToolPrompt({
      ' EN ': ' prompt en ',
      es: '   ',
      fr: 123,
    });

    expect(localized).toEqual({ en: 'prompt en' });
    expect(resolveToolPromptForLocale(localized, 'de-DE')).toBe('prompt en');
    expect(resolveToolPromptForLocale(null, 'es')).toBeNull();
    expect(resolveLocalizedToolPrompt(['bad-shape'])).toEqual({});
  });

  it('returns empty objects when card config or tool prompts are not valid objects', () => {
    expect(getToolPromptsByLocaleForCard('weather_forecast', undefined)).toEqual({});
    expect(
      getToolPromptsByLocaleForCard('weather_forecast', {
        toolPrompts: [],
      })
    ).toEqual({});
    expect(
      getEnabledToolPromptsForCard('weather_forecast', {
        toolPrompts: {
          show_weather_forecast: {
            pt: 'clima detalhado',
          },
        },
      }, 'pt-BR')
    ).toEqual({
      show_weather_forecast: 'clima detalhado',
    });
  });

  it('preserves backwards compatibility for legacy string prompts', () => {
    const byLocale = getToolPromptsByLocaleForCard('weather_forecast', {
      toolPrompts: {
        show_weather_forecast: 'respuesta corta',
      },
    });
    const enabledPrompts = getEnabledToolPromptsForCard(
      'weather_forecast',
      {
        toolPrompts: {
          show_weather_forecast: 'respuesta corta',
        },
      },
      'en'
    );

    expect(byLocale.show_weather_forecast).toEqual({
      es: 'respuesta corta',
      en: 'respuesta corta',
    });
    expect(enabledPrompts.show_weather_forecast).toBe('respuesta corta');
  });

  it('has mappings for every card', () => {
    expect(Object.keys(FLOW_TOOL_IDS_BY_CARD)).toContain('weather_forecast');
    expect(FLOW_TOOL_IDS_BY_CARD.weather_forecast).toEqual(['show_weather_forecast']);
  });
});
