import { z } from 'zod';
import { getUsernameFromRequest, isClerkAuthEnabled } from '@/lib/auth';
import { resolveProfileAvatarSettings, getStoredUserAvatarSettings, saveStoredUserAvatarSettings } from '@/lib/profile/avatar-settings';
import { getProfileUiSettings } from '@/lib/profile/ui-settings';
import { getUsageSummaryForUser } from '@/lib/profile/usage';
import { getSecurityHeaders } from '@/lib/security';
import { ensureCurrentClerkUserAccess } from '@/lib/access/clerk-user';

type ClerkIdentity = {
  usageUsername: string;
  displayName: string;
};

const UpdateProfileSchema = z.object({
  avatarSettings: z
    .object({
      assistantCustomDataUrl: z.string().nullable().optional(),
      userCustomDataUrl: z.string().nullable().optional(),
    })
    .optional(),
});

async function resolveProfileRequestContext(
  req: Request
): Promise<{ username: string; displayName: string } | Response> {
  if (isClerkAuthEnabled()) {
    let clerkIdentity: ClerkIdentity | null = null;
    try {
      const resolvedIdentity = await ensureCurrentClerkUserAccess();
      clerkIdentity = resolvedIdentity
        ? {
            usageUsername: resolvedIdentity.username,
            displayName: resolvedIdentity.displayName,
          }
        : null;
    } catch (error) {
      console.error('Clerk auth resolution failed in /api/profile:', error);
    }

    if (!clerkIdentity) {
      return Response.json(
        { error: 'Authentication required' },
        {
          status: 401,
          headers: {
            ...getSecurityHeaders(),
          },
        }
      );
    }

    return {
      username: clerkIdentity.usageUsername,
      displayName: clerkIdentity.displayName,
    };
  }

  const username = getUsernameFromRequest(req);
  return {
    username,
    displayName: username,
  };
}

export async function GET(req: Request) {
  try {
    const context = await resolveProfileRequestContext(req);
    if (context instanceof Response) {
      return context;
    }

    const [usage, uiSettings, avatarSettings] = await Promise.all([
      getUsageSummaryForUser(context.username),
      getProfileUiSettings(),
      resolveProfileAvatarSettings(context.username),
    ]);

    return Response.json(
      {
        profile: {
          username: context.username,
          displayName: context.displayName,
        },
        usage,
        uiSettings,
        avatarSettings,
      },
      {
        headers: {
          ...getSecurityHeaders(),
        },
      }
    );
  } catch (error) {
    console.error('Profile API error:', error);
    return Response.json(
      { error: 'No se pudo cargar el perfil' },
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
  try {
    const context = await resolveProfileRequestContext(req);
    if (context instanceof Response) {
      return context;
    }

    const body = await req.json();
    const parsed = UpdateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          error: 'Invalid profile payload',
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

    const currentSettings = await getStoredUserAvatarSettings(context.username);
    await saveStoredUserAvatarSettings(context.username, {
      assistantCustomDataUrl:
        parsed.data.avatarSettings?.assistantCustomDataUrl ??
        currentSettings.assistantCustomDataUrl,
      userCustomDataUrl:
        parsed.data.avatarSettings?.userCustomDataUrl ?? currentSettings.userCustomDataUrl,
    });

    const avatarSettings = await resolveProfileAvatarSettings(context.username);
    return Response.json(
      {
        success: true,
        avatarSettings,
      },
      {
        headers: {
          ...getSecurityHeaders(),
        },
      }
    );
  } catch (error) {
    console.error('Profile API update error:', error);
    return Response.json(
      { error: 'No se pudo guardar el perfil' },
      {
        status: 500,
        headers: {
          ...getSecurityHeaders(),
        },
      }
    );
  }
}
