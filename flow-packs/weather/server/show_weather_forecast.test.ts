import { describe, expect, it, vi, beforeEach } from 'vitest';
import { show_weather_forecast } from './index';
import { getWeatherForecast } from '@packs/weather/shared/open-meteo';

vi.mock('@packs/weather/shared/open-meteo', () => ({
  getWeatherForecast: vi.fn(),
}));

describe('show_weather_forecast tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses card defaults and returns weather_forecast payload', async () => {
    vi.mocked(getWeatherForecast).mockResolvedValueOnce({
      locationName: 'Bogotá, Bogotá, Colombia',
      timezone: 'America/Bogota',
      latitude: 4.61,
      longitude: -74.08,
      units: 'metric',
      summary: 'Clima en Bogotá: nublado.',
      current: {
        time: '2026-03-05T12:00',
        weatherCode: 3,
        weatherLabel: 'Nublado',
        temperature: 19,
        apparentTemperature: 18,
        windSpeed: 11,
      },
      daily: [],
    });

    const abortController = new AbortController();
    const tool = show_weather_forecast({
      isEnglish: false,
      detectedPlate: null,
      abortSignal: abortController.signal,
      cardConfigById: {
        weather_forecast: {
          provider: 'open-meteo',
          defaultLocation: 'Bogotá',
          units: 'metric',
          forecastDays: 5,
        },
      },
    });

    const result = await tool.execute({});

    expect(getWeatherForecast).toHaveBeenCalledWith(
      expect.objectContaining({
        location: 'Bogotá',
        locale: 'es',
        units: 'metric',
        forecastDays: 5,
        signal: abortController.signal,
      })
    );
    expect(result).toMatchObject({
      type: 'weather_forecast',
      locationName: 'Bogotá, Bogotá, Colombia',
      units: 'metric',
    });
  });

  it('returns validation error when provider is unsupported', async () => {
    const tool = show_weather_forecast({
      isEnglish: true,
      detectedPlate: null,
      cardConfigById: {
        weather_forecast: {
          provider: 'custom-provider',
        },
      },
    });

    const result = await tool.execute({ location: 'Miami' });
    expect(result).toEqual({
      type: 'error',
      message: 'Weather provider "custom-provider" is not supported. Use open-meteo.',
    });
    expect(getWeatherForecast).not.toHaveBeenCalled();
  });

  it('returns error when no location is provided and no default exists', async () => {
    const tool = show_weather_forecast({
      isEnglish: false,
      detectedPlate: null,
      cardConfigById: {
        weather_forecast: {
          provider: 'open-meteo',
        },
      },
    });

    const result = await tool.execute({});
    expect(result).toEqual({
      type: 'error',
      message: 'Indica una ubicación (por ejemplo: /clima Bogotá).',
    });
    expect(getWeatherForecast).not.toHaveBeenCalled();
  });

  it('prefers request units and configured locale when provider alias is supported', async () => {
    vi.mocked(getWeatherForecast).mockResolvedValueOnce({
      locationName: 'Miami, Florida, United States',
      timezone: 'America/New_York',
      latitude: 25.77,
      longitude: -80.19,
      units: 'imperial',
      summary: 'Weather in Miami: Mainly clear.',
      current: {
        time: '2026-03-05T10:00',
        weatherCode: 1,
        weatherLabel: 'Mainly clear',
        temperature: 78,
        apparentTemperature: 80,
        windSpeed: 9,
      },
      daily: [],
    });

    const tool = show_weather_forecast({
      isEnglish: false,
      detectedPlate: null,
      cardConfigById: {
        weather_forecast: {
          provider: 'openweather',
          defaultLocation: 'Bogotá',
          units: 'metric',
          lang: 'en-US',
          forecastDays: '4',
        },
      },
    });

    await tool.execute({ location: 'Miami', units: 'imperial' });

    expect(getWeatherForecast).toHaveBeenCalledWith(
      expect.objectContaining({
        location: 'Miami',
        units: 'imperial',
        locale: 'en',
        forecastDays: 4,
      })
    );
  });

  it('returns localized error when provider call fails', async () => {
    vi.mocked(getWeatherForecast).mockRejectedValueOnce(new Error('Remote down'));

    const tool = show_weather_forecast({
      isEnglish: false,
      detectedPlate: null,
      cardConfigById: {
        weather_forecast: {
          provider: 'open-meteo',
          defaultLocation: 'Bogotá',
        },
      },
    });

    await expect(tool.execute({})).resolves.toEqual({
      type: 'error',
      message: 'Error al consultar el pronóstico del clima: Remote down',
    });
  });

  it('rethrows abort errors from provider calls', async () => {
    const abortError = new Error('The operation was aborted.');
    abortError.name = 'AbortError';
    vi.mocked(getWeatherForecast).mockRejectedValueOnce(abortError);

    const tool = show_weather_forecast({
      isEnglish: true,
      detectedPlate: null,
      cardConfigById: {
        weather_forecast: {
          provider: 'open-meteo',
          defaultLocation: 'Boston',
        },
      },
    });

    await expect(tool.execute({})).rejects.toThrow('The operation was aborted.');
  });
});
