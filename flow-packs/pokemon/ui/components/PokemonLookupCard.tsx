'use client';

import Image from 'next/image';
import { ChevronDown, Pause, Volume2 } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import type { FlowPackToolRendererProps } from '@/lib/platform/pack-ui';

interface PokemonCardData {
  id: number;
  displayName: string;
  genus: string | null;
  flavorText: string | null;
  heightMeters: number;
  weightKg: number;
  types: string[];
  abilities: string[];
  stats: Array<{
    name: string;
    label: string;
    value: number;
  }>;
  spriteUrl: string | null;
  artworkUrl: string | null;
  cryUrl: string | null;
}

function isPokemonCardData(value: unknown): value is PokemonCardData {
  return typeof value === 'object' && value !== null && 'displayName' in value && 'stats' in value;
}

interface CollapsibleSectionProps {
  title: string;
  sectionId: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

function CollapsibleSection({
  title,
  sectionId,
  isOpen,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <div className="rounded-[24px] border border-zinc-200 bg-white/85 dark:border-zinc-800 dark:bg-zinc-950/70">
      <div className="flex items-center gap-3 p-4">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={sectionId}
          onClick={onToggle}
          className="flex flex-1 items-center justify-between gap-3 text-left"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            {title}
          </p>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition-transform dark:border-zinc-700 dark:text-zinc-300">
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </span>
        </button>
      </div>

      {isOpen ? <div id={sectionId} className="px-4 pb-4">{children}</div> : null}
    </div>
  );
}

export function PokemonLookupCard({ toolMessage, locale }: FlowPackToolRendererProps) {
  if (toolMessage.type !== 'dynamic_card' || toolMessage.data.cardId !== 'pokemon_lookup') {
    return null;
  }

  const dynamicCardData = toolMessage.data as typeof toolMessage.data & {
    pokemon?: unknown;
  };
  const pokemon = isPokemonCardData(dynamicCardData.pokemon) ? dynamicCardData.pokemon : null;
  const [openSections, setOpenSections] = useState({
    description: true,
    measurements: true,
    abilities: true,
    stats: true,
  });
  const [isCryPlaying, setIsCryPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const idPrefix = useId();
  const pokemonId = pokemon?.id ?? null;
  const pokemonCryUrl = pokemon?.cryUrl ?? null;

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        // JSDOM does not fully implement media playback controls.
      }
    }

    setIsCryPlaying(false);
  }, [pokemonCryUrl, pokemonId]);

  if (!pokemon) {
    return null;
  }

  const imageUrl = pokemon.artworkUrl ?? pokemon.spriteUrl;
  const flavorText = pokemon.flavorText?.trim() ?? '';
  const copy =
    locale === 'es'
      ? {
          noImage: 'Sin imagen',
          description: 'Descripcion',
          measurements: 'Medidas',
          abilities: 'Habilidades',
          stats: 'Estadisticas base',
          height: 'Altura',
          weight: 'Peso',
          playCry: 'Escuchar sonido',
          pauseCry: 'Detener sonido',
        }
      : {
          noImage: 'No image',
          description: 'Description',
          measurements: 'Measurements',
          abilities: 'Abilities',
          stats: 'Base stats',
          height: 'Height',
          weight: 'Weight',
          playCry: 'Play cry',
          pauseCry: 'Stop cry',
        };

  function toggleSection(section: keyof typeof openSections) {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  }

  function toggleCry() {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (audio.paused) {
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise) {
        void playPromise.catch(() => {
          setIsCryPlaying(false);
        });
      }
      return;
    }

    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {
      setIsCryPlaying(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-[linear-gradient(140deg,_rgba(255,255,255,0.98)_0%,_rgba(250,245,255,0.96)_100%)] shadow-[0_24px_80px_-48px_rgba(24,24,27,0.45)] dark:border-zinc-800 dark:bg-[linear-gradient(140deg,_rgba(24,24,27,0.98)_0%,_rgba(30,27,75,0.88)_100%)]">
      <div className="space-y-4 p-5">
        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="rounded-[24px] border border-zinc-200 bg-white/85 p-4 dark:border-zinc-800 dark:bg-zinc-950/70">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300">
                #{pokemon.id}
              </span>
              {pokemon.genus ? (
                <span className="text-xs text-zinc-500 dark:text-zinc-400">{pokemon.genus}</span>
              ) : null}
            </div>

            <div className="mt-4 flex items-center justify-center rounded-[20px] bg-[radial-gradient(circle_at_top,_rgba(196,181,253,0.4),_rgba(255,255,255,0.1))] p-4">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={pokemon.displayName}
                  width={180}
                  height={180}
                  className="h-[180px] w-[180px] object-contain"
                  unoptimized
                />
              ) : (
                <div className="flex h-[180px] w-[180px] items-center justify-center rounded-full border border-dashed border-zinc-300 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                  {copy.noImage}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-zinc-200 bg-white/85 p-4 dark:border-zinc-800 dark:bg-zinc-950/70">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                  {pokemon.displayName}
                </h3>
                {pokemon.genus ? (
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{pokemon.genus}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {pokemon.types.map((type) => (
                  <span
                    key={type}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                  >
                    {type}
                  </span>
                ))}
                {pokemon.cryUrl ? (
                  <button
                    type="button"
                    onClick={toggleCry}
                    className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 transition hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/20"
                    aria-label={isCryPlaying ? copy.pauseCry : copy.playCry}
                  >
                    {isCryPlaying ? <Pause className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                    <span>{isCryPlaying ? copy.pauseCry : copy.playCry}</span>
                  </button>
                ) : null}
              </div>
            </div>

            {toolMessage.data.message ? (
              <p className="mt-4 text-sm leading-7 text-zinc-700 dark:text-zinc-200">
                {toolMessage.data.message}
              </p>
            ) : null}

            {pokemon.cryUrl ? (
              <audio
                ref={audioRef}
                src={pokemon.cryUrl}
                preload="none"
                onPlay={() => setIsCryPlaying(true)}
                onPause={() => setIsCryPlaying(false)}
                onEnded={() => setIsCryPlaying(false)}
              />
            ) : null}
          </div>
        </div>

        {flavorText ? (
          <CollapsibleSection
            title={copy.description}
            sectionId={`${idPrefix}-description`}
            isOpen={openSections.description}
            onToggle={() => toggleSection('description')}
          >
            <p className="text-sm leading-7 text-zinc-700 dark:text-zinc-200">{flavorText}</p>
          </CollapsibleSection>
        ) : null}

        <div className="grid gap-3">
          <CollapsibleSection
            title={copy.measurements}
            sectionId={`${idPrefix}-measurements`}
            isOpen={openSections.measurements}
            onToggle={() => toggleSection('measurements')}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-white/80 p-3 dark:border-zinc-800 dark:bg-zinc-950/70">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                  {copy.height}
                </p>
                <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {pokemon.heightMeters} m
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white/80 p-3 dark:border-zinc-800 dark:bg-zinc-950/70">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                  {copy.weight}
                </p>
                <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {pokemon.weightKg} kg
                </p>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title={copy.abilities}
            sectionId={`${idPrefix}-abilities`}
            isOpen={openSections.abilities}
            onToggle={() => toggleSection('abilities')}
          >
            <div className="flex flex-wrap gap-2">
              {pokemon.abilities.map((ability) => (
                <span
                  key={ability}
                  className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                >
                  {ability}
                </span>
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title={copy.stats}
            sectionId={`${idPrefix}-stats`}
            isOpen={openSections.stats}
            onToggle={() => toggleSection('stats')}
          >
            <div className="space-y-3">
              {pokemon.stats.map((stat) => (
                <div key={stat.name}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-zinc-700 dark:text-zinc-300">{stat.label}</span>
                    <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                      {stat.value}
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div
                      className="h-2 rounded-full bg-[linear-gradient(90deg,_#7c3aed_0%,_#ec4899_100%)]"
                      style={{ width: `${Math.min(100, Math.max(8, stat.value / 2))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        </div>
      </div>
    </section>
  );
}
