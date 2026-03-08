import { ChatBackendToolId } from '@/lib/chat/commands';
import { ChatApiMessage } from '@/lib/chat/types';

export function getLatestUserMessage(messages: ChatApiMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === 'user') {
      return messages[i].content ?? '';
    }
  }
  return '';
}

export function getLatestUserMessageIndex(messages: ChatApiMessage[]): number {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === 'user') {
      return i;
    }
  }
  return -1;
}

export function buildSlashCommandToolInstruction(
  toolId: ChatBackendToolId,
  isEnglish: boolean
): string {
  return isEnglish
    ? `SLASH COMMAND OVERRIDE: The user explicitly selected a slash command mapped to "${toolId}". Prioritize this tool in your next action. If required arguments are missing, ask one short follow-up question and do not switch to another tool.`
    : `ANULACION POR SLASH COMMAND: El usuario selecciono explicitamente un comando slash que corresponde a "${toolId}". Prioriza esta herramienta en tu siguiente accion. Si faltan argumentos requeridos, haz una sola pregunta corta de seguimiento y no cambies a otra herramienta.`;
}

export function jsonLineStream(payloads: Array<Record<string, unknown>>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const payload of payloads) {
        controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
      }
      controller.close();
    },
  });
}
