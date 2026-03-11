import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { adminPages, profileWidgets, renderers } from './index';
import type { ChatToolMessage } from '@/lib/chatHistory';

vi.mock('./components/WeatherAdminPanel', () => ({
  WeatherAdminPanel: ({ locale }: { locale: 'es' | 'en' }) => <div>{`admin-${locale}`}</div>,
}));

vi.mock('./components/WeatherProfileWidget', () => ({
  WeatherProfileWidget: ({ locale }: { locale: 'es' | 'en' }) => <div>{`profile-${locale}`}</div>,
}));

function createToolMessage(type: ChatToolMessage['type']): ChatToolMessage {
  return {
    id: 'tool-1',
    type,
    title: 'title',
    data:
      type === 'weather_forecast'
        ? {
            locationName: 'Bogota',
            timezone: 'America/Bogota',
            units: 'metric',
            summary: 'Clima en Bogota',
            current: {
              time: '2026-03-05T12:00',
              weatherCode: 3,
              weatherLabel: 'Nublado',
              temperature: 19,
              apparentTemperature: 18,
              windSpeed: 11,
            },
            daily: [],
          }
        : {},
    dismissible: true,
  } as ChatToolMessage;
}

describe('weather ui pack', () => {
  it('registers localized title metadata', () => {
    expect(renderers).toHaveLength(1);
    expect(renderers[0].titleByLocale).toEqual({
      es: 'Pronóstico del clima',
      en: 'Weather forecast',
    });
  });

  it('renders the forecast card for weather_forecast messages', () => {
    const Component = renderers[0].Component;

    render(
      <Component
        toolMessage={createToolMessage('weather_forecast')}
        locale="es"
        onRemove={vi.fn()}
        onFormSubmit={vi.fn()}
      />
    );

    expect(screen.getByText('Bogota')).toBeInTheDocument();
    expect(screen.getByText('Clima en Bogota')).toBeInTheDocument();
  });

  it('returns null for non-weather tool messages', () => {
    const Component = renderers[0].Component;
    const { container } = render(
      <Component
        toolMessage={createToolMessage('error')}
        locale="es"
        onRemove={vi.fn()}
        onFormSubmit={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('registers weather admin and profile extensions', () => {
    const AdminPage = adminPages[0].Component;
    const ProfileWidget = profileWidgets[0].Component;

    expect(adminPages[0]).toMatchObject({
      id: 'weather-admin',
      slug: 'weather',
      order: 30,
    });
    expect(profileWidgets[0]).toMatchObject({
      id: 'weather-preferences',
      order: 30,
    });

    render(<AdminPage locale="en" />);
    render(<ProfileWidget locale="es" profile={{} as never} usage={{} as never} />);

    expect(screen.getByText('admin-en')).toBeInTheDocument();
    expect(screen.getByText('profile-es')).toBeInTheDocument();
  });
});
