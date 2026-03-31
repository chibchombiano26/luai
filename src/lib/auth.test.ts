import { afterEach, describe, expect, it } from 'vitest';
import { getUsernameFromRequest, isClerkAuthEnabled } from './auth';

describe('getUsernameFromRequest', () => {
  const originalAtob = globalThis.atob;
  const originalEnv = process.env;

  afterEach(() => {
    globalThis.atob = originalAtob;
    process.env = originalEnv;
  });

  it('returns anonymous when authorization header is missing', () => {
    const request = new Request('http://localhost');
    expect(getUsernameFromRequest(request)).toBe('anonymous');
  });

  it('returns username from a valid basic auth header', () => {
    const header = `Basic ${Buffer.from('jose:password').toString('base64')}`;
    const request = new Request('http://localhost', {
      headers: { authorization: header },
    });

    expect(getUsernameFromRequest(request)).toBe('jose');
  });

  it('prefers forwarded username header when available', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-auth-username': 'forwarded-user' },
    });

    expect(getUsernameFromRequest(request)).toBe('forwarded-user');
  });

  it('ignores forwarded username when Clerk auth is enabled', () => {
    process.env = {
      ...originalEnv,
      CLERK_AUTH_ENABLED: 'true',
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_123',
      CLERK_SECRET_KEY: 'sk_test_123',
    };

    const request = new Request('http://localhost', {
      headers: { 'x-auth-username': 'forwarded-user' },
    });

    expect(getUsernameFromRequest(request)).toBe('anonymous');
  });

  it('returns anonymous when decoded value does not contain separator', () => {
    const header = `Basic ${Buffer.from('invalidvalue').toString('base64')}`;
    const request = new Request('http://localhost', {
      headers: { authorization: header },
    });

    expect(getUsernameFromRequest(request)).toBe('anonymous');
  });

  it('returns anonymous when username is empty after decode', () => {
    const header = `Basic ${Buffer.from(':password').toString('base64')}`;
    const request = new Request('http://localhost', {
      headers: { authorization: header },
    });

    expect(getUsernameFromRequest(request)).toBe('anonymous');
  });

  it('falls back to Buffer decoding when atob is not available', () => {
    // Simulate environments where atob is absent.
    Object.defineProperty(globalThis, 'atob', {
      configurable: true,
      value: undefined,
    });

    const header = `Basic ${Buffer.from('buffer-user:pwd').toString('base64')}`;
    const request = new Request('http://localhost', {
      headers: { authorization: header },
    });

    expect(getUsernameFromRequest(request)).toBe('buffer-user');
  });

  it('returns anonymous when decoder throws', () => {
    globalThis.atob = () => {
      throw new Error('invalid-base64');
    };

    const request = new Request('http://localhost', {
      headers: { authorization: 'Basic not-base64' },
    });

    expect(getUsernameFromRequest(request)).toBe('anonymous');
  });

  it('falls back to BASIC_AUTH_USERNAME when auth header is missing', () => {
    process.env = {
      ...originalEnv,
      BASIC_AUTH_ENABLED: 'true',
      BASIC_AUTH_USERNAME: 'admin-user',
    };

    const request = new Request('http://localhost');
    expect(getUsernameFromRequest(request)).toBe('admin-user');
  });

  it('does not fall back to basic username when Clerk auth is enabled', () => {
    process.env = {
      ...originalEnv,
      CLERK_AUTH_ENABLED: 'true',
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_123',
      CLERK_SECRET_KEY: 'sk_test_123',
      BASIC_AUTH_ENABLED: 'true',
      BASIC_AUTH_USERNAME: 'admin-user',
    };

    const request = new Request('http://localhost');
    expect(getUsernameFromRequest(request)).toBe('anonymous');
  });

  it('does not fall back to basic username when basic auth is disabled', () => {
    process.env = {
      ...originalEnv,
      BASIC_AUTH_ENABLED: 'false',
      BASIC_AUTH_USERNAME: 'admin-user',
    };

    const request = new Request('http://localhost');
    expect(getUsernameFromRequest(request)).toBe('anonymous');
  });

  it('detects Clerk auth enabled only when both keys are present', () => {
    process.env = {
      ...originalEnv,
      CLERK_AUTH_ENABLED: 'true',
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_123',
      CLERK_SECRET_KEY: 'sk_test_123',
    };
    expect(isClerkAuthEnabled()).toBe(true);

    process.env = {
      ...originalEnv,
      CLERK_AUTH_ENABLED: 'true',
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: '',
      CLERK_SECRET_KEY: 'sk_test_123',
    };
    expect(isClerkAuthEnabled()).toBe(false);
  });

  it('honors explicit Clerk disable flag even when keys are present', () => {
    process.env = {
      ...originalEnv,
      CLERK_AUTH_ENABLED: 'false',
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_123',
      CLERK_SECRET_KEY: 'sk_test_123',
    };

    expect(isClerkAuthEnabled()).toBe(false);
  });
});
