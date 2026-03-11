'use client';

import { WeatherAdminPanel } from './components/WeatherAdminPanel';
import { WeatherForecastCard } from './components/WeatherForecastCard';
import { WeatherProfileWidget } from './components/WeatherProfileWidget';
import type { FlowPackUiModule, FlowPackToolRendererProps } from '@/lib/platform/pack-ui';

function WeatherForecastRenderer({ toolMessage, locale }: FlowPackToolRendererProps) {
  if (toolMessage.type !== 'weather_forecast') return null;

  return (
    <WeatherForecastCard
      locationName={toolMessage.data.locationName}
      timezone={toolMessage.data.timezone}
      units={toolMessage.data.units}
      summary={toolMessage.data.summary}
      current={toolMessage.data.current}
      daily={toolMessage.data.daily}
      locale={locale}
    />
  );
}

export const renderers: FlowPackUiModule['renderers'] = [
  {
    toolType: 'weather_forecast',
    titleByLocale: {
      es: 'Pronóstico del clima',
      en: 'Weather forecast',
    },
    Component: WeatherForecastRenderer,
  },
];

export const adminPages: FlowPackUiModule['adminPages'] = [
  {
    id: 'weather-admin',
    slug: 'weather',
    iconKey: 'settings',
    order: 30,
    navLabelByLocale: {
      es: 'Weather',
      en: 'Weather',
    },
    titleByLocale: {
      es: 'Weather',
      en: 'Weather',
    },
    subtitleByLocale: {
      es: 'Operacion y defaults del flow pack de pronostico.',
      en: 'Operations and defaults for the forecast flow pack.',
    },
    Component: ({ locale }) => <WeatherAdminPanel locale={locale} />,
  },
];

export const profileWidgets: FlowPackUiModule['profileWidgets'] = [
  {
    id: 'weather-preferences',
    order: 30,
    titleByLocale: {
      es: 'Preferencias de clima',
      en: 'Weather preferences',
    },
    Component: ({ locale }) => <WeatherProfileWidget locale={locale} />,
  },
];
