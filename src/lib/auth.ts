export function isClerkAuthEnabled(): boolean {
  if (process.env.CLERK_AUTH_ENABLED === 'false') {
    return false;
  }
  return Boolean(
    process.env.CLERK_SECRET_KEY?.trim() &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim()
  );
}

function getBasicFallbackUsername(): string {
  if (isClerkAuthEnabled()) {
    return '';
  }
  if (process.env.BASIC_AUTH_ENABLED === 'false') {
    return '';
  }
  return process.env.BASIC_AUTH_USERNAME?.trim() ?? '';
}

export function getUsernameFromRequest(request: Request): string {
  if (!isClerkAuthEnabled()) {
    const forwardedUsername = request.headers.get('x-auth-username')?.trim();
    if (forwardedUsername) {
      return forwardedUsername;
    }
  }

  const header = request.headers.get('authorization');
  if (!header || !header.startsWith('Basic ')) {
    return getBasicFallbackUsername() || 'anonymous';
  }

  const encoded = header.slice(6);

  try {
    const decoded =
      typeof atob === 'function'
        ? atob(encoded)
        : Buffer.from(encoded, 'base64').toString('utf-8');

    const separator = decoded.indexOf(':');
    if (separator === -1) {
      return 'anonymous';
    }

    const username = decoded.slice(0, separator).trim();
    return username || 'anonymous';
  } catch {
    return getBasicFallbackUsername() || 'anonymous';
  }
}
