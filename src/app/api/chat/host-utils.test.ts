import { describe, expect, it } from 'vitest';
import {
  buildSlashCommandToolInstruction,
  getLatestUserMessage,
  getLatestUserMessageIndex,
  jsonLineStream,
} from './host-utils';

describe('chat host utils', () => {
  it('returns latest user message and index', () => {
    const messages = [
      { role: 'assistant', content: 'hello' },
      { role: 'user', content: 'first' },
      { role: 'assistant', content: 'middle' },
      { role: 'user', content: 'latest' },
    ] as const;

    expect(getLatestUserMessage(messages as never)).toBe('latest');
    expect(getLatestUserMessageIndex(messages as never)).toBe(3);
    expect(getLatestUserMessage([] as never)).toBe('');
    expect(getLatestUserMessageIndex([] as never)).toBe(-1);
  });

  it('builds slash command instructions for both locales', () => {
    expect(buildSlashCommandToolInstruction('show_weather_forecast', true)).toContain(
      'SLASH COMMAND OVERRIDE'
    );
    expect(buildSlashCommandToolInstruction('show_weather_forecast', false)).toContain(
      'ANULACION POR SLASH COMMAND'
    );
  });

  it('serializes json line stream', async () => {
    const stream = jsonLineStream([{ a: 1 }, { b: 'x' }]);
    const text = await new Response(stream).text();
    expect(text).toBe('{"a":1}\n{"b":"x"}\n');
  });
});
