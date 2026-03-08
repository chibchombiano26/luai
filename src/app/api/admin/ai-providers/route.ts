import { z } from 'zod';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { isClerkAuthEnabled } from '@/lib/auth';
import { getSecurityHeaders } from '@/lib/security';
import { isAdminRole, resolveAppUserRoleFromMetadata } from '@/lib/access/roles';
import {
  deleteAiProviderSecret,
  getAiProviderStatuses,
  isAiProviderId,
  saveAiProviderSecret,
} from '@/lib/ai-providers';

const UpdateAiProviderSchema = z.object({
  providerId: z.string().trim().min(1),
  apiKey: z.string().trim().min(1),
});

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
        { error: 'Clerk auth must be enabled to manage AI providers' },
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
    console.error('Admin AI providers auth error:', error);
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

export async function GET() {
  const context = await resolveAdminRequestContext();
  if (context.error) {
    return context.error as Response;
  }

  try {
    const providers = await getAiProviderStatuses();

    return Response.json(
      { providers },
      {
        headers: {
          ...getSecurityHeaders(),
        },
      }
    );
  } catch (error) {
    console.error('Admin AI providers GET error:', error);
    return Response.json(
      { error: 'Failed to load AI providers' },
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
    const parsed = UpdateAiProviderSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          error: 'Invalid AI provider payload',
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

    if (!isAiProviderId(parsed.data.providerId)) {
      return Response.json(
        { error: 'Unsupported AI provider' },
        {
          status: 400,
          headers: {
            ...getSecurityHeaders(),
          },
        }
      );
    }

    const provider = await saveAiProviderSecret(parsed.data.providerId, parsed.data.apiKey);

    return Response.json(
      {
        success: true,
        provider,
      },
      {
        headers: {
          ...getSecurityHeaders(),
        },
      }
    );
  } catch (error) {
    console.error('Admin AI providers POST error:', error);
    return Response.json(
      { error: 'Failed to save AI provider' },
      {
        status: 500,
        headers: {
          ...getSecurityHeaders(),
        },
      }
    );
  }
}

export async function DELETE(req: Request) {
  const context = await resolveAdminRequestContext();
  if (context.error) {
    return context.error as Response;
  }

  try {
    const body = await req.json();
    const parsed = z
      .object({
        providerId: z.string().trim().min(1),
      })
      .safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          error: 'Invalid AI provider payload',
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

    if (!isAiProviderId(parsed.data.providerId)) {
      return Response.json(
        { error: 'Unsupported AI provider' },
        {
          status: 400,
          headers: {
            ...getSecurityHeaders(),
          },
        }
      );
    }

    const provider = await deleteAiProviderSecret(parsed.data.providerId);

    return Response.json(
      {
        success: true,
        provider,
      },
      {
        headers: {
          ...getSecurityHeaders(),
        },
      }
    );
  } catch (error) {
    console.error('Admin AI providers DELETE error:', error);
    return Response.json(
      { error: 'Failed to delete AI provider' },
      {
        status: 500,
        headers: {
          ...getSecurityHeaders(),
        },
      }
    );
  }
}
