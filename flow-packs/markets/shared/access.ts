import { auth, clerkClient } from '@clerk/nextjs/server';
import { getUsernameFromRequest, isClerkAuthEnabled } from '@/lib/auth';
import { ensureCurrentClerkUserAccess } from '@/lib/access/clerk-user';
import { isAdminRole, resolveAppUserRoleFromMetadata } from '@/lib/access/roles';
import { getSecurityHeaders } from '@/lib/security';

export interface MarketRequestIdentity {
  username: string;
  displayName: string;
}

export function responseJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getSecurityHeaders(),
    },
  });
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return result === 0;
}

function isBasicAuthConfigured(): boolean {
  if (isClerkAuthEnabled()) {
    return false;
  }

  if (process.env.BASIC_AUTH_ENABLED === 'false') {
    return false;
  }

  return Boolean(
    process.env.BASIC_AUTH_USERNAME?.trim() &&
      process.env.BASIC_AUTH_PASSWORD?.trim()
  );
}

function isBasicAuthRequestAuthenticated(request: Request): boolean {
  if (!isBasicAuthConfigured()) {
    return false;
  }

  const header = request.headers.get('authorization');
  if (!header || !header.startsWith('Basic ')) {
    return false;
  }

  try {
    const encoded = header.slice(6);
    const decoded =
      typeof atob === 'function'
        ? atob(encoded)
        : Buffer.from(encoded, 'base64').toString('utf-8');
    const separatorIndex = decoded.indexOf(':');
    if (separatorIndex === -1) {
      return false;
    }

    const requestUsername = decoded.slice(0, separatorIndex);
    const requestPassword = decoded.slice(separatorIndex + 1);
    const expectedUsername = process.env.BASIC_AUTH_USERNAME?.trim() ?? '';
    const expectedPassword = process.env.BASIC_AUTH_PASSWORD?.trim() ?? '';

    return (
      constantTimeEqual(requestUsername, expectedUsername) &&
      constantTimeEqual(requestPassword, expectedPassword)
    );
  } catch {
    return false;
  }
}

function isNoAuthDevelopmentMode(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.CLERK_AUTH_ENABLED === 'false' &&
    process.env.BASIC_AUTH_ENABLED === 'false'
  );
}

export async function resolveMarketUserContext(
  request: Request
): Promise<MarketRequestIdentity | Response> {
  if (isClerkAuthEnabled()) {
    const fallbackIdentity = (() => {
      const fromHeader = getUsernameFromRequest(request);
      if (typeof fromHeader !== 'string') {
        return null;
      }

      const normalized = fromHeader.trim();
      if (!normalized || normalized === 'anonymous') {
        return null;
      }

      return { username: normalized, displayName: normalized };
    })();

    let clerkIdentity: MarketRequestIdentity | null = null;
    try {
      const resolvedIdentity = await ensureCurrentClerkUserAccess();
      clerkIdentity = resolvedIdentity
        ? {
            username: resolvedIdentity.username,
            displayName: resolvedIdentity.displayName,
          }
        : null;
    } catch (error) {
      console.error('Market user context resolution failed:', error);
    }

    const finalIdentity = clerkIdentity ?? fallbackIdentity;
    if (!finalIdentity) {
      return responseJson({ error: 'Authentication required' }, 401);
    }

    return finalIdentity;
  }

  const username = getUsernameFromRequest(request);
  return {
    username,
    displayName: username,
  };
}

export async function ensureMarketAdminAccess(request: Request): Promise<Response | null> {
  if (isClerkAuthEnabled()) {
    try {
      const authState = await auth();
      if (!authState.userId) {
        return responseJson({ error: 'Authentication required' }, 401);
      }

      const client = await clerkClient();
      const actorUser = await client.users.getUser(authState.userId);
      const actorRole = resolveAppUserRoleFromMetadata(actorUser.publicMetadata);
      if (!isAdminRole(actorRole)) {
        return responseJson({ error: 'Admin privileges required' }, 403);
      }

      return null;
    } catch (error) {
      console.error('Market admin auth failed:', error);
      return responseJson({ error: 'Authentication failed' }, 401);
    }
  }

  if (isBasicAuthRequestAuthenticated(request)) {
    return null;
  }

  if (isBasicAuthConfigured()) {
    return responseJson({ error: 'Authentication required' }, 401);
  }

  if (isNoAuthDevelopmentMode()) {
    return null;
  }

  return responseJson(
    { error: 'Authentication must be configured to manage market settings' },
    503
  );
}
