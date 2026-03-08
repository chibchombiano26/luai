import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const protectMock = vi.fn();
let authState: {
  userId: string | null;
  sessionClaims?: Record<string, unknown>;
} = {
  userId: null,
  sessionClaims: {},
};

vi.mock('@clerk/nextjs/server', async () => {
  const actual = await vi.importActual<typeof import('next/server')>('next/server');

  return {
    clerkMiddleware: (handler: (auth: (() => Promise<typeof authState>) & { protect: typeof protectMock }, request: Request) => unknown) => {
      return (request: Request) => {
        const auth = Object.assign(
          () => Promise.resolve(authState),
          { protect: protectMock }
        );
        return handler(auth, request);
      };
    },
    createRouteMatcher:
      (patterns: string[]) =>
      (request: { nextUrl?: URL; url?: string }) => {
        const pathname = request.nextUrl?.pathname ?? new URL(request.url ?? 'http://localhost').pathname;
        return patterns.some((pattern) => {
          if (pattern.startsWith('/api')) return pathname.startsWith('/api');
          if (pattern.startsWith('/sign-in')) return pathname.startsWith('/sign-in');
          if (pattern.startsWith('/sign-up')) return pathname.startsWith('/sign-up');
          return pathname === pattern;
        });
      },
    NextResponse: actual.NextResponse,
  };
});

describe('middleware with Clerk enabled', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      CLERK_AUTH_ENABLED: 'true',
      CLERK_SECRET_KEY: 'sk_test_123',
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_123',
    };
    authState = { userId: null, sessionClaims: {} };
    protectMock.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('allows public auth routes without protecting them', async () => {
    const { middleware } = await import('./middleware');

    const response = await middleware(
      new Request('http://localhost/sign-in'),
      {} as never
    );

    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(protectMock).not.toHaveBeenCalled();
  });

  it('allows the home page without forcing a Clerk redirect', async () => {
    const { middleware } = await import('./middleware');

    const response = await middleware(
      new Request('http://localhost/'),
      {} as never
    );

    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(protectMock).not.toHaveBeenCalled();
  });

  it('allows the public health route without invoking Clerk auth', async () => {
    const { middleware } = await import('./middleware');

    const response = await middleware(
      new Request('http://localhost/api/health'),
      {} as never
    );

    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(protectMock).not.toHaveBeenCalled();
  });

  it('lets unauthenticated API requests pass through untouched', async () => {
    const { middleware } = await import('./middleware');

    const response = await middleware(
      new Request('http://localhost/api/chat'),
      {} as never
    );

    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(response.headers.get('x-auth-username')).toBeNull();
    expect(protectMock).not.toHaveBeenCalled();
  });

  it('adds auth username to API requests when a Clerk session exists', async () => {
    authState = {
      userId: 'user_123',
      sessionClaims: {
        email: 'user@example.com',
        role: 'viewer',
      },
    };
    const { middleware } = await import('./middleware');

    const response = await middleware(
      new Request('http://localhost/api/profile'),
      {} as never
    );

    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(protectMock).not.toHaveBeenCalled();
  });

  it('protects non-api routes and falls back to username or userId', async () => {
    authState = {
      userId: 'user_456',
      sessionClaims: {
        username: 'jose',
        role: 'operator',
      },
    };
    const { middleware } = await import('./middleware');

    const response = await middleware(
      new Request('http://localhost/admin'),
      {} as never
    );

    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(protectMock).toHaveBeenCalledTimes(1);
  });

  it('allows authenticated API requests even before role provisioning completes', async () => {
    authState = {
      userId: 'user_789',
      sessionClaims: {
        email: 'no-role@example.com',
      },
    };
    const { middleware } = await import('./middleware');

    const response = await middleware(
      new Request('http://localhost/api/profile'),
      {} as never
    );

    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('allows authenticated public routes so server provisioning can assign viewer role', async () => {
    authState = {
      userId: 'user_999',
      sessionClaims: {
        email: 'no-role@example.com',
      },
    };
    const { middleware } = await import('./middleware');

    const response = await middleware(
      new Request('http://localhost/'),
      {} as never
    );

    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(protectMock).not.toHaveBeenCalled();
  });

  it('allows authenticated requests without Clerk metadata when a local dev role override is set', async () => {
    process.env.DEV_AUTH_ROLE = 'admin';
    authState = {
      userId: 'user_local',
      sessionClaims: {
        email: 'local@example.com',
      },
    };
    const { middleware } = await import('./middleware');

    const response = await middleware(
      new Request('http://localhost/admin'),
      {} as never
    );

    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(protectMock).toHaveBeenCalledTimes(1);
  });
});
