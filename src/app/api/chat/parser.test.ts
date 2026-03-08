import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parseChatRequest } from './parser';

vi.mock('@/lib/auth', () => ({
  getUsernameFromRequest: vi.fn(() => 'parser-user'),
}));

function createRequest(payload: unknown): Request {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

describe('parseChatRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses explicit command prompt when slash text cannot be inferred', async () => {
    const context = await parseChatRequest(
      createRequest({
        locale: 'es',
        commandId: 'weather_forecast',
        messages: [{ role: 'user', content: '/no-existe-comando' }],
      })
    );

    expect(context.slashCommandId).toBe('weather_forecast');
    expect(context.normalizedLastUserMessage).toContain('pronóstico del clima');
    expect(context.messages[0].content).toBe(context.normalizedLastUserMessage);
  });

  it('replaces only the last user message when normalization is applied', async () => {
    const context = await parseChatRequest(
      createRequest({
        locale: 'es',
        messages: [
          { role: 'user', content: 'primer mensaje' },
          { role: 'assistant', content: 'respuesta previa' },
          { role: 'user', content: '/clima bogota' },
        ],
      })
    );

    expect(context.lastUserMessageIndex).toBe(2);
    expect(context.messages[0].content).toBe('primer mensaje');
    expect(context.messages[1].content).toBe('respuesta previa');
    expect(context.messages[2].content).toContain('Muéstrame el pronóstico del clima');
  });

  it('normalizes slash commands that are enabled by active cards', async () => {
    const context = await parseChatRequest(
      createRequest({
        locale: 'es',
        messages: [{ role: 'user', content: '/clima' }],
      }),
      { enabledCommandIds: ['weather_forecast'] }
    );

    expect(context.slashCommandId).toBe('weather_forecast');
    expect(context.normalizedLastUserMessage).toContain('pronóstico del clima');
  });

  it('ignores explicit commandId when command is disabled by card config', async () => {
    const context = await parseChatRequest(
      createRequest({
        locale: 'es',
        commandId: 'weather_forecast',
        messages: [{ role: 'user', content: 'necesito ayuda' }],
      }),
      { enabledCommandIds: [] }
    );

    expect(context.explicitCommandId).toBeNull();
    expect(context.slashCommandId).toBeNull();
    expect(context.normalizedLastUserMessage).toBe('necesito ayuda');
  });
});
