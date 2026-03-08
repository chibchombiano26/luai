import { ReactNode } from 'react';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isClerkAuthEnabled } from '@/lib/auth';
import { isAdminRole, resolveAppUserRoleFromMetadata } from '@/lib/access/roles';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (!isClerkAuthEnabled()) {
    return <>{children}</>;
  }

  try {
    const authState = await auth();
    if (!authState.userId) {
      redirect('/');
    }

    const client = await clerkClient();
    const currentUser = await client.users.getUser(authState.userId);
    const role = resolveAppUserRoleFromMetadata(currentUser.publicMetadata);

    if (!isAdminRole(role)) {
      redirect('/');
    }
  } catch (error) {
    console.error('Admin layout authz error:', error);
    redirect('/');
  }

  return <>{children}</>;
}
