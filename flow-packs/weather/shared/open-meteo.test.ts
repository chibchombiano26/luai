import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getWeatherForecast } from './open-meteo';

describe('open-meteo weather client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves forecast from geocoding + forecast endpoints in metric units', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              name: 'Bogotá',
              country: 'Colombia',
              admin1: 'Bogotá',
              latitude: 4.61,
              longitude: -74.08,
              timezone: 'America/Bogota',
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          timezone: 'America/Bogota',
          latitude: 4.61,
          longitude: -74.08,
          current: {
            time: '2026-03-05T12:00',
            temperature_2m: 19.4,
            apparent_temperature: 18.8,
            weather_code: 3,
            wind_speed_10m: 14.2,
          },
          daily: {
            time: ['2026-03-05', '2026-03-06'],
            weather_code: [3, 61],
            temperature_2m_max: [20.1, 19.3],
            temperature_2m_min: [11.8, 12.1],
            precipitation_probability_max: [55, 70],
            sunrise: ['2026-03-05T05:50', '2026-03-06T05:49'],
            sunset: ['2026-03-05T17:58', '2026-03-06T17:58'],
          },
        }),
      });

    vi.stubGlobal('fetch', fetchMock);

    const result = await getWeatherForecast({
      location: 'Bogotá',
      locale: 'es',
      units: 'metric',
    });

    expect(result.locationName).toBe('Bogotá, Bogotá, Colombia');
    expect(result.units).toBe('metric');
    expect(result.current.weatherLabel).toBe('Nublado');
    expect(result.daily).toHaveLength(2);
    expect(result.daily[0].selected).toBe(true);
    expect(result.summary).toContain('Clima en Bogotá');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain('geocoding-api.open-meteo.com/v1/search');
    expect(fetchMock.mock.calls[1][0]).toContain('api.open-meteo.com/v1/forecast');
    expect(fetchMock.mock.calls[1][0]).toContain('temperature_unit=celsius');
    expect(fetchMock.mock.calls[1][0]).toContain('wind_speed_unit=kmh');
  });

  it('supports imperial units and selects requested date when available', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              name: 'Miami',
              country: 'United States',
              admin1: 'Florida',
              latitude: 25.77,
              longitude: -80.19,
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          timezone: 'America/New_York',
          latitude: 25.77,
          longitude: -80.19,
          current: {
            time: '2026-03-05T10:00',
            temperature_2m: 78,
            apparent_temperature: 81,
            weather_code: 1,
            wind_speed_10m: 9,
          },
          daily: {
            time: ['2026-03-05', '2026-03-06', '2026-03-07'],
            weather_code: [1, 2, 80],
            temperature_2m_max: [81, 79, 76],
            temperature_2m_min: [71, 70, 68],
            precipitation_probability_max: [20, 25, 60],
          },
        }),
      });

    vi.stubGlobal('fetch', fetchMock);

    const result = await getWeatherForecast({
      location: 'Miami',
      locale: 'en',
      units: 'imperial',
      date: '2026-03-07',
    });

    expect(result.units).toBe('imperial');
    expect(result.daily.find((day) => day.selected)?.date).toBe('2026-03-07');
    expect(result.summary).toContain('Weather in Miami');
    expect(fetchMock.mock.calls[1][0]).toContain('temperature_unit=fahrenheit');
    expect(fetchMock.mock.calls[1][0]).toContain('wind_speed_unit=mph');
  });

  it('throws when geocoding does not return results', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      })
    );

    await expect(
      getWeatherForecast({
        location: 'Unknown City',
        locale: 'en',
      })
    ).rejects.toThrow('No matches found');
  });

  it('falls back to metric defaults and first day when units, date, and forecastDays are invalid', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              name: 'Quito',
              country: 'Ecuador',
              latitude: -0.18,
              longitude: -78.47,
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          timezone: 'America/Guayaquil',
          latitude: -0.18,
          longitude: -78.47,
          current: {
            time: '2026-03-05T09:00',
            temperature_2m: 17.6,
            apparent_temperature: 17.1,
            weather_code: 999,
            wind_speed_10m: 8.3,
          },
          daily: {
            time: ['2026-03-05', '2026-03-06'],
            weather_code: [999, 2],
            temperature_2m_max: [19.4, 20.2],
            temperature_2m_min: [10.3, 11.2],
          },
        }),
      });

    vi.stubGlobal('fetch', fetchMock);

    const result = await getWeatherForecast({
      location: 'Quito',
      locale: 'en',
      units: 'kelvin' as never,
      date: 'not-a-date',
      forecastDays: 99,
    });

    expect(result.units).toBe('metric');
    expect(result.current.weatherLabel).toBe('Variable conditions');
    expect(result.daily[0].selected).toBe(true);
    expect(result.summary).toContain('precipitation n/a');
    expect(fetchMock.mock.calls[1][0]).toContain('forecast_days=7');
    expect(fetchMock.mock.calls[1][0]).toContain('temperature_unit=celsius');
  });

  it('throws a localized validation error when location is empty', async () => {
    await expect(
      getWeatherForecast({
        location: '   ',
        locale: 'es',
      })
    ).rejects.toThrow('Debes indicar una ubicación.');
  });

  it('converts canceled fetch requests into AbortError', async () => {
    const canceledError = new Error('Request canceled');
    canceledError.name = 'CanceledError';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValueOnce(canceledError)
    );

    await expect(
      getWeatherForecast({
        location: 'Bogotá',
        locale: 'es',
      })
    ).rejects.toMatchObject({
      name: 'AbortError',
      message: 'The operation was aborted.',
    });
  });

  it('surfaces non-ok forecast responses', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              name: 'Lima',
              country: 'Peru',
              latitude: -12.04,
              longitude: -77.03,
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

    vi.stubGlobal('fetch', fetchMock);

    await expect(
      getWeatherForecast({
        location: 'Lima',
        locale: 'en',
      })
    ).rejects.toThrow('Weather API request failed (503)');
  });
});
