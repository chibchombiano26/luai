import { describe, expect, it } from 'vitest';
import {
  getEnabledSlashCommandIdsForCard,
  getSlashCommandIdsForCard,
  getMenuCommandIdsForEnabledCards,
  getSlashCommandIdsForEnabledCards,
} from './slash-commands';

describe('platform slash commands', () => {
  it('returns all default commands for enabled cards', () => {
    const commandIds = getSlashCommandIdsForEnabledCards(['weather_forecast']);

    expect(commandIds).toEqual(['weather_forecast']);
  });

  it('respects enabledCommands override per card', () => {
    const commandIds = getSlashCommandIdsForEnabledCards(['weather_forecast'], {
      weather_forecast: {
        enabledCommands: [],
      },
    });

    expect(commandIds).toEqual([]);
  });

  it('filters menu commands with overrides', () => {
    const menuCommandIds = getMenuCommandIdsForEnabledCards(['weather_forecast'], {
      weather_forecast: {
        enabledCommands: [],
      },
    });

    expect(menuCommandIds).toEqual([]);
  });

  it('resolves per-card toggles for command list', () => {
    expect(getSlashCommandIdsForCard('weather_forecast')).toEqual(['weather_forecast']);
    expect(getEnabledSlashCommandIdsForCard('weather_forecast', {})).toEqual([
      'weather_forecast',
    ]);
    expect(
      getEnabledSlashCommandIdsForCard('weather_forecast', {
        enabledCommands: [],
      })
    ).toEqual([]);
  });

  it('ignores invalid configured command ids and deduplicates menu commands', () => {
    const commandIds = getSlashCommandIdsForEnabledCards(
      ['weather_forecast', 'weather_forecast'],
      {
        weather_forecast: {
          enabledCommands: ['weather_forecast', 'unknown', 123],
        } as never,
      }
    );

    expect(commandIds).toEqual(['weather_forecast']);
    expect(
      getMenuCommandIdsForEnabledCards(['weather_forecast'], {
        weather_forecast: {
          enabledCommands: ['unknown'],
        },
      })
    ).toEqual([]);
  });
});
