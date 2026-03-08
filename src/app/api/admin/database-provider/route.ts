import { z } from 'zod';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { isClerkAuthEnabled } from '@/lib/auth';
import { getSecurityHeaders } from '@/lib/security';
import { isAdminRole, resolveAppUserRoleFromMetadata } from '@/lib/access/roles';
import {
  getDatabaseProviderStatus,
  revealDatabaseProviderSecret,
  saveDatabaseProviderConfig,
} from '@/lib/database-provider-config';
import { resetDbInstance } from '@/lib/db';
import { resetPostgresClient } from '@/lib/database/postgres/client';
import { resetRepositoryFactory } from '@/lib/repositories/repository-factory';

const SaveDatabaseProviderSchema = z.discriminatedUnion('selectedProvider', [
  z.object({
    selectedProvider: z.literal('sqlite'),
  }),
  z.object({
    selectedProvider: z.literal('turso'),
    tursoUrl: z.string().trim().min(1),
    tursoAuthToken: z.string().trim().optional(),
  }),
  z.object({
    selectedProvider: z.literal('postgres'),
    postgresConnectionString: z.string().trim().min(1),
  }),
]);

async function resolveAdminRequestContext() {
  const isNoAuthDevelopmentMode =
    process.env.NODE_ENV !== 'production' &&
    process.env.CLERK_AUTH_ENABLED === 'false' &&
    process.env.BASIC_AUTH_ENABLED === 'false';

  if (!isClerkAuthEnabled()) {
    if (isNoAuthDevelopmentMode) {
      return {
        error: null,
      };
    }

    return {
      error: Response.json(
        { error: 'Clerk auth must be enabled to manage database providers' },
        {
          status: 503,
          headers: {
            ...getSecurityHeaders(),
          },
        }
      ),
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
      };
    }

    return {
      error: null,
    };
  } catch (error) {
    console.error('Admin database provider auth error:', error);
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
    };
  }
}

export async function GET(req: Request) {
  const context = await resolveAdminRequestContext();
  if (context.error) {
    return context.error as Response;
  }

  try {
    const requestUrl = new URL(req.url);
    const includeSecret = requestUrl.searchParams.get('includeSecret') === '1';
    const providerId = requestUrl.searchParams.get('provider');

    if (includeSecret && providerId === 'turso') {
      const secret = await revealDatabaseProviderSecret('turso');
      return Response.json(
        {
          provider: 'turso',
          authToken: secret.authToken,
          source: secret.source,
        },
        {
          headers: {
            ...getSecurityHeaders(),
          },
        }
      );
    }

    if (includeSecret && providerId === 'postgres') {
      const secret = await revealDatabaseProviderSecret('postgres');
      return Response.json(
        {
          provider: 'postgres',
          connectionString: secret.connectionString ?? null,
          source: secret.source,
        },
        {
          headers: {
            ...getSecurityHeaders(),
          },
        }
      );
    }

    const status = await getDatabaseProviderStatus();
    return Response.json(
      { status },
      {
        headers: {
          ...getSecurityHeaders(),
        },
      }
    );
  } catch (error) {
    console.error('Admin database provider GET error:', error);
    return Response.json(
      { error: 'Failed to load database provider' },
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

  try {
    const body = await req.json();
    const parsed = SaveDatabaseProviderSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          error: 'Invalid database provider payload',
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

    const status = await saveDatabaseProviderConfig(parsed.data);
    resetDbInstance();
    await resetPostgresClient();
    resetRepositoryFactory();

    return Response.json(
      {
        success: true,
        status,
      },
      {
        headers: {
          ...getSecurityHeaders(),
        },
      }
    );
  } catch (error) {
    console.error('Admin database provider POST error:', error);
    return Response.json(
      { error: 'Failed to save database provider' },
      {
        status: 500,
        headers: {
          ...getSecurityHeaders(),
        },
      }
    );
  }
}
