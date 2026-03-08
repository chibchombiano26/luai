import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DELETE, GET, POST } from './route';
import { auth as clerkAuth, clerkClient as clerkServerClient } from '@clerk/nextjs/server';
import { isClerkAuthEnabled } from '@/lib/auth';
import { getSecurityHeaders } from '@/lib/security';
import { deleteAiProviderSecret, getAiProviderStatuses, saveAiProviderSecret } from '@/lib/ai-providers';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  isClerkAuthEnabled: vi.fn(),
}));

vi.mock('@/lib/security', () => ({
  getSecurityHeaders: vi.fn(() => ({ 'X-Test-Header': 'ok' })),
}));

vi.mock('@/lib/ai-providers', () => ({
  getAiProviderStatuses: vi.fn(),
  saveAiProviderSecret: vi.fn(),
  deleteAiProviderSecret: vi.fn(),
  isAiProviderId: vi.fn((value: unknown) => value === 'gemini'),
}));

const usersApi = {
  getUser: vi.fn(),
};

describe('Admin AI providers API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(isClerkAuthEnabled).mockReturnValue(true);
    vi.mocked(clerkAuth).mockResolvedValue({ userId: 'user_admin' } as never);
    vi.mocked(clerkServerClient).mockResolvedValue({ users: usersApi } as never);
    usersApi.getUser.mockResolvedValue({
      id: 'user_admin',
      publicMetadata: { role: 'admin' },
    });
    vi.mocked(getAiProviderStatuses).mockResolvedValue([
      {
        id: 'gemini',
        label: { es: 'Google Gemini', en: 'Google Gemini' },
        configured: true,
        hasStoredSecret: true,
        configuredVia: 'admin',
        updatedAt: '2026-03-05T00:00:00.000Z',
      },
    ]);
    vi.mocked(saveAiProviderSecret).mockResolvedValue({
      id: 'gemini',
      label: { es: 'Google Gemini', en: 'Google Gemini' },
      configured: true,
      hasStoredSecret: true,
      configuredVia: 'admin',
      updatedAt: '2026-03-05T00:00:00.000Z',
    });
    vi.mocked(deleteAiProviderSecret).mockResolvedValue({
      id: 'gemini',
      label: { es: 'Google Gemini', en: 'Google Gemini' },
      configured: false,
      hasStoredSecret: false,
      configuredVia: null,
      updatedAt: null,
    });
  });

  it('returns 503 when Clerk auth is disabled', async () => {
    vi.mocked(isClerkAuthEnabled).mockReturnValueOnce(false);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(response.headers.get('X-Test-Header')).toBe('ok');
    expect(body).toEqual({ error: 'Clerk auth must be enabled to manage AI providers' });
  });

  it('allows listing providers in explicit noauth development mode', async () => {
    vi.mocked(isClerkAuthEnabled).mockReturnValueOnce(false);
    process.env.CLERK_AUTH_ENABLED = 'false';
    process.env.BASIC_AUTH_ENABLED = 'false';

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      providers: [
        {
          id: 'gemini',
          label: { es: 'Google Gemini', en: 'Google Gemini' },
          configured: true,
          hasStoredSecret: true,
          configuredVia: 'admin',
          updatedAt: '2026-03-05T00:00:00.000Z',
        },
      ],
    });
  });

  it('returns 401 when no authenticated Clerk user exists', async () => {
    vi.mocked(clerkAuth).mockResolvedValueOnce({ userId: null } as never);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: 'Authentication required' });
  });

  it('returns 403 when actor is not admin', async () => {
    usersApi.getUser.mockResolvedValueOnce({
      id: 'user_viewer',
      publicMetadata: { role: 'viewer' },
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'Admin privileges required' });
  });

  it('lists provider statuses without returning secrets', async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      providers: [
        {
          id: 'gemini',
          label: { es: 'Google Gemini', en: 'Google Gemini' },
          configured: true,
          hasStoredSecret: true,
          configuredVia: 'admin',
          updatedAt: '2026-03-05T00:00:00.000Z',
        },
      ],
    });
    expect(getAiProviderStatuses).toHaveBeenCalled();
  });

  it('saves a provider key without returning the key value', async () => {
    const response = await POST(
      new Request('http://localhost/api/admin/ai-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: 'gemini',
          apiKey: 'new-secret-key',
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(saveAiProviderSecret).toHaveBeenCalledWith('gemini', 'new-secret-key');
    expect(body).toEqual({
      success: true,
      provider: {
        id: 'gemini',
        label: { es: 'Google Gemini', en: 'Google Gemini' },
        configured: true,
        hasStoredSecret: true,
        configuredVia: 'admin',
        updatedAt: '2026-03-05T00:00:00.000Z',
      },
    });
    expect(JSON.stringify(body)).not.toContain('new-secret-key');
  });

  it('allows saving a provider key in explicit noauth development mode', async () => {
    vi.mocked(isClerkAuthEnabled).mockReturnValueOnce(false);
    process.env.CLERK_AUTH_ENABLED = 'false';
    process.env.BASIC_AUTH_ENABLED = 'false';

    const response = await POST(
      new Request('http://localhost/api/admin/ai-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: 'gemini',
          apiKey: 'new-secret-key',
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(saveAiProviderSecret).toHaveBeenCalledWith('gemini', 'new-secret-key');
  });

  it('returns 400 when payload is invalid', async () => {
    const response = await POST(
      new Request('http://localhost/api/admin/ai-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: 'gemini',
          apiKey: '',
        }),
      })
    );

    expect(response.status).toBe(400);
    expect(getSecurityHeaders).toHaveBeenCalled();
  });

  it('returns 400 when provider is unsupported', async () => {
    const response = await POST(
      new Request('http://localhost/api/admin/ai-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: 'openai',
          apiKey: 'secret',
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Unsupported AI provider' });
  });

  it('deletes a saved provider key without returning the key value', async () => {
    const response = await DELETE(
      new Request('http://localhost/api/admin/ai-providers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: 'gemini',
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(deleteAiProviderSecret).toHaveBeenCalledWith('gemini');
    expect(body).toEqual({
      success: true,
      provider: {
        id: 'gemini',
        label: { es: 'Google Gemini', en: 'Google Gemini' },
        configured: false,
        hasStoredSecret: false,
        configuredVia: null,
        updatedAt: null,
      },
    });
  });

  it('allows deleting a provider key in explicit noauth development mode', async () => {
    vi.mocked(isClerkAuthEnabled).mockReturnValueOnce(false);
    process.env.CLERK_AUTH_ENABLED = 'false';
    process.env.BASIC_AUTH_ENABLED = 'false';

    const response = await DELETE(
      new Request('http://localhost/api/admin/ai-providers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: 'gemini',
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(deleteAiProviderSecret).toHaveBeenCalledWith('gemini');
  });
});
