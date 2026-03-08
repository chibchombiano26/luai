import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { middleware } from './middleware';

function makeBasicHeader(username: string, password: string): string {
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}

describe('auth middleware', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.CLERK_AUTH_ENABLED = 'false';
    process.env.BASIC_AUTH_ENABLED = 'true';
    process.env.BASIC_AUTH_USERNAME = 'admin';
    process.env.BASIC_AUTH_PASSWORD = 'secret';
    process.env = { ...process.env, NODE_ENV: 'development' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('allows request when auth is disabled', () => {
    process.env.BASIC_AUTH_ENABLED = 'false';

    const response = middleware({ headers: new Headers() } as never);
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('allows the public health route without auth', () => {
    const response = middleware({
      headers: new Headers(),
      nextUrl: new URL('http://localhost/api/health'),
    } as never);

    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('allows the public health route when only request.url is available', () => {
    const response = middleware({
      headers: new Headers(),
      url: 'http://localhost/api/health',
    } as never);

    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('returns 401 when auth header is missing', () => {
    const response = middleware({ headers: new Headers() } as never);

    expect(response.status).toBe(401);
    expect(response.headers.get('WWW-Authenticate')).toContain('Basic realm=');
  });

  it('returns 401 for invalid credentials', () => {
    const response = middleware(
      {
        headers: new Headers({
          authorization: makeBasicHeader('admin', 'wrong'),
        }),
      } as never
    );

    expect(response.status).toBe(401);
  });

  it('allows request with valid credentials', () => {
    const response = middleware(
      {
        headers: new Headers({
          authorization: makeBasicHeader('admin', 'secret'),
        }),
      } as never
    );

    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('fails closed in production when credentials are missing', () => {
    process.env = { ...process.env, NODE_ENV: 'production' };
    delete process.env.BASIC_AUTH_USERNAME;
    delete process.env.BASIC_AUTH_PASSWORD;

    const response = middleware({ headers: new Headers() } as never);

    expect(response.status).toBe(500);
  });

  it('allows request in development when credentials are missing', () => {
    delete process.env.BASIC_AUTH_USERNAME;
    delete process.env.BASIC_AUTH_PASSWORD;

    const response = middleware({ headers: new Headers() } as never);

    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('returns 401 when authorization header has invalid base64', () => {
    const response = middleware(
      {
        headers: new Headers({
          authorization: 'Basic $$$',
        }),
      } as never
    );

    expect(response.status).toBe(401);
  });

  it('returns 401 when decoded credentials do not contain separator', () => {
    const malformed = `Basic ${Buffer.from('noseparator').toString('base64')}`;
    const response = middleware(
      {
        headers: new Headers({
          authorization: malformed,
        }),
      } as never
    );

    expect(response.status).toBe(401);
  });

  it('falls back to auth when request.url cannot be parsed', () => {
    const response = middleware({
      headers: new Headers(),
      url: 'not-a-valid-url',
    } as never);

    expect(response.status).toBe(401);
  });
});
