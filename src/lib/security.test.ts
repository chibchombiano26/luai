import { describe, expect, it } from 'vitest';
import { getSecurityHeaders } from './security';

describe('getSecurityHeaders', () => {
  it('returns expected hardening headers', () => {
    const headers = getSecurityHeaders();

    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['X-XSS-Protection']).toBe('1; mode=block');
    expect(headers['Strict-Transport-Security']).toContain('max-age=31536000');
    expect(headers['Content-Security-Policy']).toContain("default-src 'self'");
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
  });
});
