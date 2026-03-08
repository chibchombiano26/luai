import { getSecurityHeaders } from '@/lib/security';

export async function GET() {
  return Response.json(
    {
      ok: true,
    },
    {
      headers: {
        ...getSecurityHeaders(),
      },
    }
  );
}
