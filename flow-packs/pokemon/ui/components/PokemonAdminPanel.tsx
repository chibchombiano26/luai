'use client';

import type { AppLocale } from '@/lib/i18n';

const COPY = {
  es: {
    introTitle: 'Modulo de Pokemon',
    introBody:
      'Este pack publica consultas a PokeAPI, soporta el comando /pokemon y tambien puede exponerse por MCP para integraciones externas.',
    runtimeTitle: 'Piezas registradas',
    runtimeItems: [
      'Card: pokemon_lookup',
      'Tool: show_pokemon_lookup',
      'Comando principal: /pokemon',
      'MCP: habilitado por mcp/index.ts',
    ],
    configTitle: 'Configuracion minima',
    configBody:
      'El pack usa un JSON compacto. Hoy la configuracion principal controla el idioma base del lookup.',
    notesTitle: 'Recomendaciones',
    notesItems: [
      'Usa lang en es o en para fijar el idioma de resumen.',
      'El comando acepta nombres como pikachu o numeros de Pokedex como 25.',
      'La tarjeta devuelve tipos, habilidades, peso, altura y estadisticas.',
      'Si integras por MCP, mantén alineadas las expectativas de idioma con el admin.',
    ],
  },
  en: {
    introTitle: 'Pokemon module',
    introBody:
      'This pack serves PokeAPI lookups, supports the /pokemon command, and can also be exposed through MCP for external integrations.',
    runtimeTitle: 'Registered pieces',
    runtimeItems: [
      'Card: pokemon_lookup',
      'Tool: show_pokemon_lookup',
      'Primary command: /pokemon',
      'MCP: enabled through mcp/index.ts',
    ],
    configTitle: 'Minimal configuration',
    configBody:
      'The pack uses compact JSON. Today the main setting controls the lookup default language.',
    notesTitle: 'Recommendations',
    notesItems: [
      'Use lang in es or en to lock the summary language.',
      'The command accepts names such as pikachu or Pokedex numbers such as 25.',
      'The card returns types, abilities, weight, height, and base stats.',
      'If you integrate through MCP, keep language expectations aligned with admin defaults.',
    ],
  },
} as const;

const POKEMON_CONFIG_EXAMPLE = `{
  "lang": "es"
}`;

export function PokemonAdminPanel({ locale }: { locale: AppLocale }) {
  const t = COPY[locale];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-amber-200 bg-[linear-gradient(135deg,_rgba(255,251,235,0.98),_rgba(255,255,255,1))] p-6 dark:border-amber-900 dark:bg-[linear-gradient(135deg,_rgba(120,53,15,0.35),_rgba(9,9,11,0.96))]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
          Pokemon
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          {t.introTitle}
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-zinc-600 dark:text-zinc-300">{t.introBody}</p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
            {t.configTitle}
          </h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{t.configBody}</p>
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-zinc-950 px-4 py-4 text-xs leading-6 text-amber-300">
            <code>{POKEMON_CONFIG_EXAMPLE}</code>
          </pre>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
            {t.runtimeTitle}
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-zinc-700 dark:text-zinc-200">
            {t.runtimeItems.map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
          {t.notesTitle}
        </h3>
        <ul className="mt-4 grid gap-3 lg:grid-cols-2">
          {t.notesItems.map((item) => (
            <li
              key={item}
              className="rounded-2xl border border-zinc-200 px-4 py-4 text-sm text-zinc-700 dark:border-zinc-800 dark:text-zinc-200"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
