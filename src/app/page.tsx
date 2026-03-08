import { HomeClient } from "@/components/home/HomeClient";
import { isClerkAuthEnabled } from '@/lib/auth';
import { ensureCurrentClerkUserAccess } from '@/lib/access/clerk-user';

export default async function Home() {
  const clerkEnabled = isClerkAuthEnabled();
  if (clerkEnabled) {
    try {
      await ensureCurrentClerkUserAccess();
    } catch (error) {
      console.error('Home page Clerk provisioning failed:', error);
    }
  }

  return (
    <main className="min-h-[100dvh] md:min-h-screen bg-white dark:bg-black flex flex-col items-center justify-start md:justify-center p-0 md:px-24 md:py-4 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px]">
      <HomeClient clerkEnabled={clerkEnabled} />
    </main>
  );
}
