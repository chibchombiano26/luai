import { describe, expect, it } from 'vitest';
import { buildSystemPrompt } from './prompts';

describe('buildSystemPrompt', () => {
  it('builds a generic prompt without hardcoding company branding', () => {
    const prompt = buildSystemPrompt({
      locale: 'es',
      enabledCardIds: new Set(['weather_forecast']),
    });

    expect(prompt).toContain('plataforma de flujos configurables');
    expect(prompt).toContain('Clima');
    expect(prompt).not.toContain('marca propietaria');
  });

  it('adds a strict no-flows guard when no cards are active', () => {
    const prompt = buildSystemPrompt({
      locale: 'es',
      enabledCardIds: new Set(),
    });

    expect(prompt).toContain('No hay cards activos');
    expect(prompt).toContain('No ofrezcas cotización, formularios ni widgets');
  });

  it('uses admin-defined card system prompt when configured', () => {
    const prompt = buildSystemPrompt({
      locale: 'es',
      enabledCardIds: new Set(['weather_forecast']),
      cardConfigById: {
        weather_forecast: {
          systemPromptByLocale: {
            es: 'FLUJO: Clima avanzado. Prioriza show_weather_forecast y responde en 2 frases.',
            en: 'FLOW: advanced weather.',
          },
        },
      },
    });

    expect(prompt).toContain('FLUJO: Clima avanzado');
    expect(prompt).not.toContain('FLUJO: Clima (weather_forecast)');
  });

  it('includes admin-defined tool prompts only for enabled cards', () => {
    const prompt = buildSystemPrompt({
      locale: 'es',
      enabledCardIds: new Set(['weather_forecast']),
      cardConfigById: {
        weather_forecast: {
          toolPrompts: {
            show_weather_forecast: 'prioriza el resumen diario y responde con tabla breve',
          },
        },
      },
    });

    expect(prompt).toContain('INSTRUCCIONES ADMIN POR HERRAMIENTA');
    expect(prompt).toContain('weather_forecast.show_weather_forecast');
    expect(prompt).toContain('prioriza el resumen diario');
  });

  it('resolves localized tool prompts by active locale', () => {
    const prompt = buildSystemPrompt({
      locale: 'en',
      enabledCardIds: new Set(['weather_forecast']),
      cardConfigById: {
        weather_forecast: {
          toolPrompts: {
            show_weather_forecast: {
              es: 'usa salida breve',
              en: 'respond with compact bullet points',
            },
          },
        },
      },
    });

    expect(prompt).toContain('respond with compact bullet points');
    expect(prompt).not.toContain('usa salida breve');
  });
});
