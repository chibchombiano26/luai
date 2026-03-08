import type { FlowPackServerModule } from '@/lib/platform/pack-server';
import { z } from 'zod';

const inputSchema = z.object({
  message: z.string().optional(),
});

export const tools: FlowPackServerModule['tools'] = {
  run_template_card: () => ({
    description: 'Run the template flow',
    inputSchema,
    execute: async (input: z.infer<typeof inputSchema>) => {
      return {
        ok: true,
        cardId: 'template_card',
        echoedMessage: typeof input.message === 'string' ? input.message : null,
      };
    },
  }),
};

export const chat: FlowPackServerModule['chat'] = {
  streamFeedbackByToolId: {
    run_template_card: {
      startStatusMessage: {
        es: 'Preparando flujo de ejemplo...',
        en: 'Preparing example flow...',
      },
      startTextMessage: {
        es: 'Voy a ejecutar el flujo de ejemplo.',
        en: 'I am going to run the example flow.',
      },
    },
  },
};
