import { auth, clerkClient } from '@clerk/nextjs/server';
import { hasAssignedAppAccessInMetadata } from '@/lib/access/roles';

type ClerkEmailAddress = {
  id: string;
  emailAddress: string;
};

type ClerkUserRecord = {
  id: string;
  createdAt?: number | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  emailAddresses?: ClerkEmailAddress[];
  primaryEmailAddressId?: string | null;
  publicMetadata?: unknown;
};

export type ClerkUserAccessContext = {
  userId: string;
  username: string;
  displayName: string;
  publicMetadata: unknown;
};

function toMetadataRecord(publicMetadata: unknown): Record<string, unknown> {
  if (!publicMetadata || typeof publicMetadata !== 'object' || Array.isArray(publicMetadata)) {
    return {};
  }

  return { ...(publicMetadata as Record<string, unknown>) };
}

function resolvePrimaryEmail(user: ClerkUserRecord): string {
  const emailAddresses = Array.isArray(user.emailAddresses) ? user.emailAddresses : [];
  if (emailAddresses.length === 0) {
    return '';
  }

  const byPrimaryId = emailAddresses.find(
    (address) => address.id === user.primaryEmailAddressId && Boolean(address.emailAddress)
  );

  return byPrimaryId?.emailAddress ?? emailAddresses[0]?.emailAddress ?? '';
}

function mapClerkUserAccessContext(user: ClerkUserRecord): ClerkUserAccessContext {
  const primaryEmail = resolvePrimaryEmail(user);
  const fullName =
    (typeof user.fullName === 'string' && user.fullName.trim()) ||
    `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  const username = primaryEmail || user.id;

  return {
    userId: user.id,
    username,
    displayName: fullName || primaryEmail || user.id,
    publicMetadata: user.publicMetadata,
  };
}

async function ensureDefaultRoleAssignment(user: ClerkUserRecord): Promise<ClerkUserRecord> {
  if (hasAssignedAppAccessInMetadata(user.publicMetadata)) {
    return user;
  }

  const client = await clerkClient();
  const firstUserResponse = await client.users.getUserList({
    limit: 1,
    orderBy: '+created_at',
  });
  const firstCreatedUserId = firstUserResponse.data[0]?.id;
  const fallbackToAdmin = !firstCreatedUserId || firstCreatedUserId === user.id;
  const role = fallbackToAdmin ? 'admin' : 'viewer';

  return client.users.updateUserMetadata(user.id, {
    publicMetadata: {
      ...toMetadataRecord(user.publicMetadata),
      role,
    },
  });
}

export async function ensureCurrentClerkUserAccess(): Promise<ClerkUserAccessContext | null> {
  const authState = await auth();
  if (!authState.userId) {
    return null;
  }

  const client = await clerkClient();
  const currentUser = await client.users.getUser(authState.userId);
  const userWithAccess = await ensureDefaultRoleAssignment(currentUser);

  return mapClerkUserAccessContext(userWithAccess);
}
