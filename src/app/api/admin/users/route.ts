import { z } from 'zod';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { isClerkAuthEnabled } from '@/lib/auth';
import { getSecurityHeaders } from '@/lib/security';
import {
  APP_USER_ROLES,
  isAdminRole,
  resolveAppUserRoleFromMetadata,
} from '@/lib/access/roles';

const UpdateAppUserRoleSchema = z.object({
  userId: z.string().trim().min(1),
  role: z.enum(APP_USER_ROLES),
});

function toMetadataRecord(publicMetadata: unknown): Record<string, unknown> {
  if (!publicMetadata || typeof publicMetadata !== 'object' || Array.isArray(publicMetadata)) {
    return {};
  }
  return { ...(publicMetadata as Record<string, unknown>) };
}

function resolvePrimaryEmail(user: {
  emailAddresses?: Array<{ id: string; emailAddress: string }>;
  primaryEmailAddressId?: string | null;
}): string {
  const emailAddresses = Array.isArray(user.emailAddresses) ? user.emailAddresses : [];
  if (emailAddresses.length === 0) {
    return '';
  }

  const byPrimaryId = emailAddresses.find(
    (address) => address.id === user.primaryEmailAddressId && Boolean(address.emailAddress)
  );

  return byPrimaryId?.emailAddress ?? emailAddresses[0]?.emailAddress ?? '';
}

function mapAdminUser(user: {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  emailAddresses?: Array<{ id: string; emailAddress: string }>;
  primaryEmailAddressId?: string | null;
  publicMetadata?: unknown;
  createdAt?: number;
  lastSignInAt?: number | null;
}) {
  const firstName = typeof user.firstName === 'string' ? user.firstName.trim() : '';
  const lastName = typeof user.lastName === 'string' ? user.lastName.trim() : '';
  const fullName = `${firstName} ${lastName}`.trim();

  return {
    id: user.id,
    fullName,
    primaryEmail: resolvePrimaryEmail(user),
    role: resolveAppUserRoleFromMetadata(user.publicMetadata),
    createdAt: typeof user.createdAt === 'number' ? user.createdAt : 0,
    lastSignInAt: typeof user.lastSignInAt === 'number' ? user.lastSignInAt : null,
  };
}

async function resolveAdminRequestContext() {
  const isNoAuthDevelopmentMode =
    process.env.NODE_ENV !== 'production' &&
    process.env.CLERK_AUTH_ENABLED === 'false' &&
    process.env.BASIC_AUTH_ENABLED === 'false';

  if (!isClerkAuthEnabled()) {
    if (isNoAuthDevelopmentMode) {
      return {
        error: null,
        client: null,
        isNoAuthDevelopmentMode: true,
      };
    }

    return {
      error: Response.json(
        { error: 'Clerk auth must be enabled to manage users' },
        {
          status: 503,
          headers: {
            ...getSecurityHeaders(),
          },
        }
      ),
      isNoAuthDevelopmentMode: false,
    };
  }

  try {
    const authState = await auth();
    if (!authState.userId) {
      return {
        error: Response.json(
          { error: 'Authentication required' },
          {
            status: 401,
            headers: {
              ...getSecurityHeaders(),
            },
          }
        ),
        client: null,
        isNoAuthDevelopmentMode: false,
      };
    }

    const client = await clerkClient();
    const actorUser = await client.users.getUser(authState.userId);
    const actorRole = resolveAppUserRoleFromMetadata(actorUser.publicMetadata);

    if (!isAdminRole(actorRole)) {
      return {
        error: Response.json(
          { error: 'Admin privileges required' },
          {
            status: 403,
            headers: {
              ...getSecurityHeaders(),
            },
          }
        ),
        client: null,
        isNoAuthDevelopmentMode: false,
      };
    }

    return {
      error: null,
      client,
      isNoAuthDevelopmentMode: false,
    };
  } catch (error) {
    console.error('Admin users auth error:', error);
    return {
      error: Response.json(
        { error: 'Authentication failed' },
        {
          status: 401,
          headers: {
            ...getSecurityHeaders(),
          },
        }
        ),
        client: null,
        isNoAuthDevelopmentMode: false,
      };
  }
}

export async function GET() {
  const context = await resolveAdminRequestContext();
  if (context.error) {
    return context.error as Response;
  }

  if (context.isNoAuthDevelopmentMode || !context.client) {
    return Response.json(
      {
        users: [],
        roles: APP_USER_ROLES,
      },
      {
        headers: {
          ...getSecurityHeaders(),
        },
      }
    );
  }

  try {
    const response = await context.client.users.getUserList({
      limit: 100,
      orderBy: '-created_at',
    });

    const users = response.data.map((user) => mapAdminUser(user));

    return Response.json(
      {
        users,
        roles: APP_USER_ROLES,
      },
      {
        headers: {
          ...getSecurityHeaders(),
        },
      }
    );
  } catch (error) {
    console.error('Admin users GET error:', error);
    return Response.json(
      { error: 'Failed to load users' },
      {
        status: 500,
        headers: {
          ...getSecurityHeaders(),
        },
      }
    );
  }
}

export async function POST(req: Request) {
  const context = await resolveAdminRequestContext();
  if (context.error) {
    return context.error as Response;
  }

  if (!context.client) {
    return Response.json(
      { error: 'Clerk auth must be enabled to manage users' },
      {
        status: 503,
        headers: {
          ...getSecurityHeaders(),
        },
      }
    );
  }

  try {
    const body = await req.json();
    const parsed = UpdateAppUserRoleSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          error: 'Invalid user role payload',
          details: parsed.error.flatten(),
        },
        {
          status: 400,
          headers: {
            ...getSecurityHeaders(),
          },
        }
      );
    }

    const targetUser = await context.client.users.getUser(parsed.data.userId);
    const nextPublicMetadata = {
      ...toMetadataRecord(targetUser.publicMetadata),
      role: parsed.data.role,
    };

    const updatedUser = await context.client.users.updateUserMetadata(parsed.data.userId, {
      publicMetadata: nextPublicMetadata,
    });

    return Response.json(
      {
        success: true,
        user: mapAdminUser(updatedUser),
      },
      {
        headers: {
          ...getSecurityHeaders(),
        },
      }
    );
  } catch (error) {
    console.error('Admin users POST error:', error);
    return Response.json(
      { error: 'Failed to update user role' },
      {
        status: 500,
        headers: {
          ...getSecurityHeaders(),
        },
      }
    );
  }
}
