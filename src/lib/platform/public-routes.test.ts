import { describe, expect, it, vi } from 'vitest';

vi.mock('./generated-flow-packs', () => ({
  GENERATED_FLOW_PACK_PUBLIC_API_ROUTES: {
    demo: {
      quote: '/api/quote/[tempId]',
    },
  },
  GENERATED_FLOW_PACK_PUBLIC_PAGES: {
    demo: {
      detail: '/flows/[id]',
    },
  },
}));

import {
  buildFlowPackPublicApiPath,
  buildFlowPackPublicPagePath,
  getFlowPackPublicApiRoute,
  getFlowPackPublicPageRoute,
} from './public-routes';

describe('platform public routes', () => {
  it('resolves declared public page and api routes', () => {
    expect(getFlowPackPublicPageRoute('demo', 'detail')).toBe('/flows/[id]');
    expect(getFlowPackPublicApiRoute('demo', 'quote')).toBe('/api/quote/[tempId]');
  });

  it('builds interpolated public paths with params', () => {
    expect(buildFlowPackPublicPagePath('demo', 'detail', { id: 'abc 123' })).toBe(
      '/flows/abc%20123'
    );
    expect(buildFlowPackPublicApiPath('demo', 'quote', { tempId: 42 })).toBe('/api/quote/42');
  });

  it('returns raw template when params are omitted and interpolates multiple params', () => {
    expect(buildFlowPackPublicPagePath('demo', 'detail')).toBe('/flows/[id]');
    expect(buildFlowPackPublicApiPath('demo', 'quote', { tempId: 'A/B?C' })).toBe(
      '/api/quote/A%2FB%3FC'
    );
  });

  it('throws for unknown public routes', () => {
    expect(() => getFlowPackPublicPageRoute('demo', 'missing')).toThrow(
      'Unknown public page route'
    );
    expect(() => getFlowPackPublicApiRoute('demo', 'missing')).toThrow(
      'Unknown public api route'
    );
  });
});
