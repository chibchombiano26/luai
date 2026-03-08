import { describe, expect, it } from 'vitest';
import manifest from './manifest';

describe('manifest', () => {
  it('returns expected PWA metadata', () => {
    const result = manifest();

    expect(result.id).toBe('/');
    expect(result.name).toBe('LuAI');
    expect(result.short_name).toBe('LuAI');
    expect(result.scope).toBe('/');
    expect(result.start_url).toBe('/');
    expect(result.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: '/web-app-manifest-192x192.png', sizes: '192x192', purpose: 'any' }),
        expect.objectContaining({ src: '/web-app-manifest-192x192.png', sizes: '192x192', purpose: 'maskable' }),
        expect.objectContaining({ src: '/web-app-manifest-512x512.png', sizes: '512x512', purpose: 'any' }),
        expect.objectContaining({ src: '/web-app-manifest-512x512.png', sizes: '512x512', purpose: 'maskable' }),
      ])
    );
  });
});
