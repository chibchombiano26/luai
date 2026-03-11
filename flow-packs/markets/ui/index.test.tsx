import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./components/MarketAdminPanel', () => ({
  MarketAdminPanel: ({ locale }: { locale: 'es' | 'en' }) => <div>{`admin-${locale}`}</div>,
}));

vi.mock('./components/MarketAssetResultCard', () => ({
  MarketAssetResultCard: ({
    locale,
    toolMessage,
  }: {
    locale: 'es' | 'en';
    toolMessage: { data: { cardId: string } };
  }) => <div>{`renderer-${locale}-${toolMessage.data.cardId}`}</div>,
}));

vi.mock('./components/MarketProfileWidget', () => ({
  MarketProfileWidget: ({ locale }: { locale: 'es' | 'en' }) => <div>{`profile-${locale}`}</div>,
}));

import { adminPages, profileWidgets, renderers } from './index';

describe('markets ui module', () => {
  it('registers the dynamic card renderer', () => {
    const Renderer = renderers[0].Component;

    expect(renderers).toHaveLength(1);
    expect(renderers[0]).toMatchObject({
      toolType: 'dynamic_card',
      cardId: 'market_asset_lookup',
      titleByLocale: {
        es: 'Activo de mercado',
        en: 'Market asset',
      },
    });

    render(
      <Renderer
        locale="es"
        onRemove={vi.fn()}
        onFormSubmit={vi.fn()}
        toolMessage={{
          id: 'tool-1',
          timestamp: Date.now(),
          type: 'dynamic_card',
          data: { cardId: 'market_asset_lookup' },
        }}
      />
    );

    expect(screen.getByText('renderer-es-market_asset_lookup')).toBeInTheDocument();
  });

  it('registers the admin page and profile widget components', () => {
    const AdminPage = adminPages[0].Component;
    const ProfileWidget = profileWidgets[0].Component;

    expect(adminPages[0]).toMatchObject({
      id: 'markets-admin',
      slug: 'markets',
      order: 40,
    });
    expect(profileWidgets[0]).toMatchObject({
      id: 'market-preferences',
      order: 20,
    });

    render(<AdminPage locale="en" />);
    render(
      <ProfileWidget
        locale="es"
        profile={{} as never}
        usage={{} as never}
      />
    );

    expect(screen.getByText('admin-en')).toBeInTheDocument();
    expect(screen.getByText('profile-es')).toBeInTheDocument();
  });
});
