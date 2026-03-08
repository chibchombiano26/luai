'use client';

import type { FlowPackToolRendererProps } from '@/lib/platform/pack-ui';

export function TemplateCard({ toolMessage, locale }: FlowPackToolRendererProps) {
  const data = toolMessage.data as { echoedMessage?: string | null } | undefined;

  return (
    <section className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold">
        {locale === 'es' ? 'Template pack' : 'Template pack'}
      </h3>
      <p className="mt-2 text-sm text-black/70">
        {locale === 'es'
          ? 'Este renderer viene desde el flow pack.'
          : 'This renderer comes from the flow pack.'}
      </p>
      {data?.echoedMessage ? (
        <p className="mt-3 text-sm">
          <strong>{locale === 'es' ? 'Mensaje:' : 'Message:'}</strong> {data.echoedMessage}
        </p>
      ) : null}
    </section>
  );
}

