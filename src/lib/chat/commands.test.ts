import { describe, expect, it } from 'vitest';
import {
  CHAT_BACKEND_TOOL_IDS,
  CHAT_COMMAND_IDS,
  getCommandCatalogEntry,
  getCommandPrompt,
  isChatCommandId,
  MENU_COMMAND_IDS,
  resolveSlashCommandInput,
} from './commands';

describe('chat commands', () => {
  it('exposes command catalogs and id guards', () => {
    expect(CHAT_COMMAND_IDS).toContain('weather_forecast');
    expect(CHAT_BACKEND_TOOL_IDS).toContain('show_weather_forecast');
    expect(MENU_COMMAND_IDS).toContain('weather_forecast');
    expect(isChatCommandId('weather_forecast')).toBe(true);
    expect(isChatCommandId('coverage')).toBe(false);
  });

  it('returns localized catalog entries and prompts', () => {
    expect(getCommandCatalogEntry('weather_forecast', 'es').name).toBe('Pronóstico del Clima');
    expect(getCommandCatalogEntry('weather_forecast', 'en').name).toBe('Weather Forecast');
    expect(getCommandPrompt('weather_forecast', 'es')).toContain('pronóstico del clima');
    expect(getCommandPrompt('weather_forecast', 'en')).toContain('weather forecast');
  });

  it('resolves exact slash command matches', () => {
    expect(resolveSlashCommandInput('/weather now', 'en')).toEqual({
      id: 'weather_forecast',
      prompt: 'Show me the weather forecast for a location',
      remainder: 'now',
    });
  });

  it('resolves unique prefix slash command matches', () => {
    expect(resolveSlashCommandInput('/clim bogota', 'es')).toEqual({
      id: 'weather_forecast',
      prompt: 'Muéstrame el pronóstico del clima para una ubicación',
      remainder: 'bogota',
    });
  });

  it('resolves only commands allowed by active cards', () => {
    expect(
      resolveSlashCommandInput('/clima bogota', 'es', ['weather_forecast'])
    ).toEqual({
      id: 'weather_forecast',
      prompt: 'Muéstrame el pronóstico del clima para una ubicación',
      remainder: 'bogota',
    });

    expect(resolveSlashCommandInput('/weather', 'en', [])).toEqual({
      id: 'weather_forecast',
      prompt: 'Show me the weather forecast for a location',
      remainder: '',
    });
  });

  it('returns null for empty, non-slash, or ambiguous inputs', () => {
    expect(resolveSlashCommandInput('history', 'en')).toBeNull();
    expect(resolveSlashCommandInput('/', 'en')).toBeNull();
    expect(resolveSlashCommandInput('/   ', 'en')).toBeNull();
    expect(resolveSlashCommandInput('/unknown', 'en')).toBeNull();
  });
});
