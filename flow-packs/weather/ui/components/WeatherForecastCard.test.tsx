import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WeatherForecastCard } from './WeatherForecastCard';

describe('WeatherForecastCard', () => {
  it('renders weather summary and daily cards', () => {
    render(
      <WeatherForecastCard
        locationName="Bogotá, Colombia"
        timezone="America/Bogota"
        units="metric"
        summary="Clima en Bogotá: ahora nublado."
        current={{
          time: '2026-03-05T12:00',
          weatherCode: 3,
          weatherLabel: 'Nublado',
          temperature: 19.2,
          apparentTemperature: 18.3,
          windSpeed: 12.1,
        }}
        daily={[
          {
            date: '2026-03-05',
            weatherCode: 3,
            weatherLabel: 'Nublado',
            tempMax: 20,
            tempMin: 11,
            precipitationProbabilityMax: 55,
            sunrise: '2026-03-05T05:50',
            sunset: '2026-03-05T17:58',
            selected: true,
          },
          {
            date: '2026-03-06',
            weatherCode: 61,
            weatherLabel: 'Lluvia ligera',
            tempMax: 19,
            tempMin: 12,
            precipitationProbabilityMax: 70,
          },
        ]}
        locale="es"
      />
    );

    expect(screen.getByText('Bogotá, Colombia')).toBeInTheDocument();
    expect(screen.getByText('Clima en Bogotá: ahora nublado.')).toBeInTheDocument();
    expect(screen.getAllByText('Nublado').length).toBeGreaterThan(0);
    expect(screen.getByText('20° / 11°')).toBeInTheDocument();
    expect(screen.getByText('19° / 12°')).toBeInTheDocument();
  });

  it('renders english imperial units, fallback precipitation, and no sun chips when times are invalid', () => {
    render(
      <WeatherForecastCard
        locationName="Miami, Florida"
        timezone="America/New_York"
        units="imperial"
        summary="Weather in Miami: mixed conditions."
        current={{
          time: '2026-03-05T12:00',
          weatherCode: 95,
          weatherLabel: 'Thunderstorm',
          temperature: 78.2,
          apparentTemperature: 80.4,
          windSpeed: 9.3,
        }}
        daily={[
          {
            date: '2026-03-05',
            weatherCode: 45,
            weatherLabel: 'Fog',
            tempMax: 82,
            tempMin: 70,
            sunrise: 'invalid',
            sunset: 'invalid',
          },
          {
            date: '2026-03-06',
            weatherCode: 71,
            weatherLabel: 'Snow',
            tempMax: 65,
            tempMin: 44,
          },
          {
            date: '2026-03-07',
            weatherCode: 51,
            weatherLabel: 'Drizzle',
            tempMax: 68,
            tempMin: 52,
          },
        ]}
        locale="en"
      />
    );

    expect(screen.getByText('Now')).toBeInTheDocument();
    expect(screen.getByText('Feels like')).toBeInTheDocument();
    expect(screen.getByText('80°F')).toBeInTheDocument();
    expect(screen.getByText('9 mph')).toBeInTheDocument();
    expect(screen.getAllByText('--').length).toBeGreaterThan(0);
    expect(screen.getByText('82° / 70°')).toBeInTheDocument();
    expect(screen.queryByText(/AM|PM/)).not.toBeInTheDocument();
  });
});
