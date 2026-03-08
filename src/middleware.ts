import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

function isPublicHealthRoute(request: NextRequest): boolean {
  const pathname =
    request.nextUrl?.pathname ??
    (typeof request.url === 'string'
      ? (() => {
          try {
            return new URL(request.url).pathname;
          } catch {
            return '';
          }
        })()
      : '');

  return pathname === '/api/health';
}

function unauthorizedResponse() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Protected Area", charset="UTF-8"',
    },
  });
}

// ✅ Constant-time string comparison for Edge Runtime compatibility
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function basicAuthMiddleware(request: NextRequest) {
  if (isPublicHealthRoute(request)) {
    return NextResponse.next();
  }

  const authEnabled = process.env.BASIC_AUTH_ENABLED !== "false";
  const username = process.env.BASIC_AUTH_USERNAME;
  const password = process.env.BASIC_AUTH_PASSWORD;

  if (!authEnabled) {
    return NextResponse.next();
  }

  // Fail closed in production when auth is expected but not configured.
  if (!username || !password) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("Server auth is misconfigured", { status: 500 });
    }
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return unauthorizedResponse();
  }

  const encoded = authHeader.slice(6);
  let decoded = "";

  try {
    decoded = atob(encoded);
  } catch {
    return unauthorizedResponse();
  }

  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex === -1) {
    return unauthorizedResponse();
  }

  const requestUser = decoded.slice(0, separatorIndex);
  const requestPassword = decoded.slice(separatorIndex + 1);

  // ✅ SECURE: Use constant-time comparison to prevent timing attacks
  // This works in Edge Runtime unlike crypto.timingSafeEqual
  const userMatch = constantTimeEqual(requestUser, username);
  const passMatch = constantTimeEqual(requestPassword, password);

  if (!userMatch || !passMatch) {
    return unauthorizedResponse();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-auth-username', requestUser);
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

const isClerkPublicRoute = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)']);
const isApiRoute = createRouteMatcher(['/api(.*)']);

const clerkAuthMiddleware = clerkMiddleware(async (auth, request) => {
  if (isPublicHealthRoute(request)) {
    return NextResponse.next();
  }

  const authState = await auth();

  if (isClerkPublicRoute(request)) {
    return NextResponse.next();
  }

  if (isApiRoute(request)) {
    if (!authState.userId) {
      return NextResponse.next();
    }

    const claims = (authState.sessionClaims ?? {}) as Record<string, unknown>;
    const usernameFromClaims =
      (typeof claims.email === 'string' && claims.email.trim()) ||
      (typeof claims.username === 'string' && claims.username.trim()) ||
      authState.userId;

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-auth-username', usernameFromClaims);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  await auth.protect();
  const claims = (authState.sessionClaims ?? {}) as Record<string, unknown>;
  const usernameFromClaims =
    (typeof claims.email === 'string' && claims.email.trim()) ||
    (typeof claims.username === 'string' && claims.username.trim()) ||
    authState.userId ||
    'anonymous';

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-auth-username', usernameFromClaims);
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});

function isClerkEnabled(): boolean {
  if (process.env.CLERK_AUTH_ENABLED === 'false') {
    return false;
  }
  return Boolean(
    process.env.CLERK_SECRET_KEY?.trim() &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim()
  );
}

export function middleware(request: NextRequest, event: NextFetchEvent) {
  if (isClerkEnabled()) {
    return clerkAuthMiddleware(request, event);
  }
  return basicAuthMiddleware(request);
}

export const config = {
  matcher: [
    // Protect UI + API routes. Keep auth UI and static assets public.
    "/((?!_next/static|_next/image|manifest.webmanifest|sw.js|offline.html|icons/|favicon.ico|favicon.svg|favicon-96x96.png|icon.png|apple-icon.png|apple-touch-icon.png|web-app-manifest-192x192.png|web-app-manifest-512x512.png).*)",
  ],
};
