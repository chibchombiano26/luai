'use client';

import { WeatherForecastCard } from './components/WeatherForecastCard';
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
