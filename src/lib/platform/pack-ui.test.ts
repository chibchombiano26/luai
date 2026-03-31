import { describe, expect, it } from 'vitest';
import {
  getFlowPackAdminPageRegistrations,
  getFlowPackHomeExperienceRegistrations,
  getFlowPackProfileWidgetRegistrations,
  resolveFlowPackAdminPage,
  resolveFlowPackHomeExperience,
  resolveFlowPackToolRenderer,
} from './pack-ui';
import type {
  FlowPackAdminPageRegistration,
  FlowPackHomeExperienceRegistration,
  FlowPackProfileWidgetRegistration,
  FlowPackToolRendererRegistration,
} from './pack-ui';
import type { ChatToolMessage } from '@/lib/chatHistory';

function createToolMessage(toolMessage: Partial<ChatToolMessage>): ChatToolMessage {
  return {
    id: 'tool-1',
    timestamp: 1,
    type: 'error',
    data: { message: 'fallback' },
    ...toolMessage,
  } as ChatToolMessage;
}

describe('platform pack ui', () => {
  const DummyComponent = (() => null) as FlowPackToolRendererRegistration['Component'];
  const DummyAdminComponent = (() => null) as FlowPackAdminPageRegistration['Component'];
  const DummyHomeComponent = (() => null) as FlowPackHomeExperienceRegistration['Component'];
  const DummyProfileComponent = (() => null) as FlowPackProfileWidgetRegistration['Component'];

  it('collects and sorts injected admin pages by order then id', () => {
    const registrations = getFlowPackAdminPageRegistrations({
      alpha: {
        adminPages: [
          {
            id: 'b-page',
            slug: 'b-page',
            navLabelByLocale: { es: 'B', en: 'B' },
            titleByLocale: { es: 'B', en: 'B' },
            order: 20,
            Component: DummyAdminComponent,
          },
          {
            id: 'a-page',
            slug: 'a-page',
            navLabelByLocale: { es: 'A', en: 'A' },
            titleByLocale: { es: 'A', en: 'A' },
            order: 20,
            Component: DummyAdminComponent,
          },
        ],
      },
      beta: {
        adminPages: [
          {
            id: 'first-page',
            slug: 'first-page',
            navLabelByLocale: { es: 'First', en: 'First' },
            titleByLocale: { es: 'First', en: 'First' },
            order: 10,
            Component: DummyAdminComponent,
          },
        ],
      },
      empty: {},
    });

    expect(registrations.map((registration) => registration.slug)).toEqual([
      'first-page',
      'a-page',
      'b-page',
    ]);
  });

  it('resolves injected admin pages by slug', () => {
    const registrations: FlowPackAdminPageRegistration[] = [
      {
        id: 'quotes-admin',
        slug: 'quotes-admin',
        navLabelByLocale: { es: 'Cotizador', en: 'Quotes' },
        titleByLocale: { es: 'Cotizador', en: 'Quotes' },
        Component: DummyAdminComponent,
      },
    ];

    expect(resolveFlowPackAdminPage(registrations, 'quotes-admin')).toEqual(registrations[0]);
    expect(resolveFlowPackAdminPage(registrations, 'missing')).toBeNull();
  });

  it('collects and sorts injected profile widgets', () => {
    const registrations = getFlowPackProfileWidgetRegistrations({
      alpha: {
        profileWidgets: [
          { id: 'usage-tier', order: 20, Component: DummyProfileComponent },
        ],
      },
      beta: {
        profileWidgets: [
          { id: 'billing-tier', order: 10, Component: DummyProfileComponent },
        ],
      },
      empty: {},
    });

    expect(registrations.map((registration) => registration.id)).toEqual([
      'billing-tier',
      'usage-tier',
    ]);
  });

  it('collects and resolves injected home experiences', () => {
    const registrations = getFlowPackHomeExperienceRegistrations({
      alpha: {
        homeExperiences: [
          { componentKey: 'bbva_form', Component: DummyHomeComponent },
        ],
      },
      beta: {
        homeExperiences: [
          { componentKey: 'bbva_wizard', Component: DummyHomeComponent },
        ],
      },
    });

    expect(registrations.map((registration) => registration.componentKey)).toEqual([
      'bbva_form',
      'bbva_wizard',
    ]);
    expect(resolveFlowPackHomeExperience(registrations, 'bbva_form')).toEqual(registrations[0]);
    expect(resolveFlowPackHomeExperience(registrations, 'missing')).toBeNull();
  });

  it('prefers exact dynamic-card matches by cardId', () => {
    const registrations: FlowPackToolRendererRegistration[] = [
      { toolType: 'dynamic_card', Component: DummyComponent },
      { toolType: 'dynamic_card', cardId: 'weather_forecast', Component: DummyComponent },
    ];

    expect(
      resolveFlowPackToolRenderer(
        registrations,
        createToolMessage({
          type: 'dynamic_card',
          data: { cardId: 'weather_forecast', title: 'Forecast' },
        })
      )
    ).toEqual(registrations[1]);
  });

  it('falls back to toolType-only registrations when card match is missing', () => {
    const registrations: FlowPackToolRendererRegistration[] = [
      { toolType: 'quote', Component: DummyComponent },
    ];

    expect(
      resolveFlowPackToolRenderer(
        registrations,
        createToolMessage({
          type: 'quote',
          data: { quote: {} },
        })
      )
    ).toEqual(registrations[0]);
  });

  it('returns null when no registration matches', () => {
    expect(
      resolveFlowPackToolRenderer(
        [{ toolType: 'quote', Component: DummyComponent }],
        createToolMessage({
          type: 'vehicle_info',
          data: {
            licensePlate: 'ABC123',
            vehicleYear: 2020,
            fasecoldaCode: '08001136',
            vehiclePrice: 1,
            ratingZoneCode: 1,
          },
        })
      )
    ).toBeNull();
  });

  it('falls back to generic dynamic-card renderer when card id is missing or invalid', () => {
    const registrations: FlowPackToolRendererRegistration[] = [
      { toolType: 'dynamic_card', Component: DummyComponent },
      { toolType: 'dynamic_card', cardId: 'weather_forecast', Component: DummyComponent },
    ];

    expect(
      resolveFlowPackToolRenderer(
        registrations,
        createToolMessage({
          type: 'dynamic_card',
          data: { cardId: 123, title: 'Fallback' } as never,
        })
      )
    ).toEqual(registrations[0]);
  });
});
