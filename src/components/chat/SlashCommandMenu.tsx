'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  CloudSun,
  History,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { AppLocale } from '@/lib/i18n';
import {
  MENU_COMMAND_IDS,
  getCommandCatalogEntry,
  type ChatCommandId,
} from '@/lib/chat/commands';
import type {
  SlashCommandDefinition,
  SlashCommandMenuHandle,
  SlashCommandMenuProps,
} from '@/lib/chat/types';
import { isFlowCardId, type FlowCardId } from '@/lib/platform/cards';
import { getMenuCommandIdsForEnabledCards } from '@/lib/platform/slash-commands';

const MENU_COPY: Record<AppLocale, { available: string; results: (query: string) => string }> = {
  es: {
    available: 'Comandos disponibles',
    results: (query) => `Resultados para "${query}"`,
  },
  en: {
    available: 'Available commands',
    results: (query) => `Results for "${query}"`,
  },
};

const COMMAND_ICONS: Record<string, LucideIcon> = {
  building: Building2,
  'cloud-sun': CloudSun,
  history: History,
};

export const SlashCommandMenu = forwardRef<SlashCommandMenuHandle, SlashCommandMenuProps>(function SlashCommandMenu({
  input,
  onSelectCommand,
  locale = 'es',
  enabledCommandIds,
}, ref) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [resolvedEnabledCommandIds, setResolvedEnabledCommandIds] = useState<ChatCommandId[] | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const copy = MENU_COPY[locale];

  useEffect(() => {
    if (input.startsWith('/')) {
      const query = input.slice(1).toLowerCase();
      setSearchQuery(query);
      setIsOpen(true);
      setSelectedIdx(0);
    } else {
      setIsOpen(false);
      setSearchQuery('');
    }
  }, [input]);

  useEffect(() => {
    if (!isOpen) return;

    if (enabledCommandIds) {
      setResolvedEnabledCommandIds(enabledCommandIds);
      return;
    }

    let isCancelled = false;

    const loadEnabledCommandsFromCards = async () => {
      try {
        const response = await fetch('/api/platform/cards');
        if (!response.ok) {
          throw new Error('Failed to load cards');
        }

        const payload = (await response.json()) as {
          cards?: Array<{ id?: unknown; config?: unknown; enabled?: unknown }>;
        };
        const cards = Array.isArray(payload.cards) ? payload.cards : [];
        const cardConfigById = cards.reduce<Record<string, Record<string, unknown>>>((acc, rawCard) => {
          if (!rawCard || typeof rawCard !== 'object') {
            return acc;
          }

          const card = rawCard as { id?: unknown; config?: unknown };
          if (typeof card.id !== 'string') {
            return acc;
          }
          if (!card.config || typeof card.config !== 'object' || Array.isArray(card.config)) {
            return acc;
          }

          acc[card.id] = card.config as Record<string, unknown>;
          return acc;
        }, {});
        const enabledCardIds = cards.reduce<FlowCardId[]>((acc, rawCard) => {
          if (!rawCard || typeof rawCard !== 'object') {
            return acc;
          }

          const card = rawCard as { id?: unknown; enabled?: unknown };
          if (card.enabled === true && isFlowCardId(card.id)) {
            acc.push(card.id);
          }
          return acc;
        }, []);

        if (!isCancelled) {
          setResolvedEnabledCommandIds(
            getMenuCommandIdsForEnabledCards(enabledCardIds, cardConfigById)
          );
        }
      } catch {
        if (!isCancelled) {
          setResolvedEnabledCommandIds(MENU_COMMAND_IDS.slice());
        }
      }
    };

    void loadEnabledCommandsFromCards();

    return () => {
      isCancelled = true;
    };
  }, [enabledCommandIds, isOpen]);

  const enabledCommandSet = resolvedEnabledCommandIds
    ? new Set<ChatCommandId>(resolvedEnabledCommandIds)
    : null;

  const menuCommandIds = MENU_COMMAND_IDS.filter(
    (commandId) => !enabledCommandSet || enabledCommandSet.has(commandId)
  );

  const commands: SlashCommandDefinition[] = menuCommandIds.map((id) => {
    const entry = getCommandCatalogEntry(id, locale);
    const Icon = (entry.iconKey ? COMMAND_ICONS[entry.iconKey] : null) ?? ChevronRight;
    return {
      id,
      name: entry.name,
      description: entry.description,
      icon: <Icon className="w-4 h-4" />,
      category: entry.category,
      example: entry.example,
    };
  });

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.name.toLowerCase().includes(searchQuery) ||
      cmd.description.toLowerCase().includes(searchQuery) ||
      cmd.id.toLowerCase().includes(searchQuery) ||
      cmd.example.toLowerCase().includes(searchQuery)
  );

  const groupedCommands = filteredCommands.reduce(
    (acc, cmd) => {
      if (!acc[cmd.category]) {
        acc[cmd.category] = [];
      }
      acc[cmd.category].push(cmd);
      return acc;
    },
    {} as Record<string, SlashCommandDefinition[]>
  );

  const handleSelectCommand = (command: SlashCommandDefinition) => {
    onSelectCommand(command);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const totalItems = filteredCommands.length;
    if (totalItems <= 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIdx((prev) => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIdx((prev) => (prev - 1 + totalItems) % totalItems);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIdx]) {
          handleSelectCommand(filteredCommands[selectedIdx]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  useImperativeHandle(ref, () => ({
    handleKeyDown(event) {
      if (!isOpen || filteredCommands.length === 0) {
        return false;
      }

      if (!['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(event.key)) {
        return false;
      }

      handleKeyDown(event as unknown as React.KeyboardEvent);
      return event.defaultPrevented;
    },
  }), [filteredCommands, isOpen, selectedIdx]);

  if (!isOpen || filteredCommands.length === 0) {
    return null;
  }

  let itemIndex = 0;

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute bottom-[calc(100%+8px)] left-0 right-0 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
      onKeyDown={handleKeyDown}
    >
      <div className="sticky top-0 px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50">
        <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
          {searchQuery ? copy.results(searchQuery) : copy.available}
        </p>
      </div>

      <div className="p-2">
        {Object.entries(groupedCommands).map(([category, categoryCommands]) => (
          <div key={category} className="mb-3 last:mb-0">
            <div className="px-3 py-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">
              {category}
            </div>
            <div className="space-y-1">
              {categoryCommands.map((command) => {
                const isSelected = selectedIdx === itemIndex;
                const currentIdx = itemIndex;
                itemIndex++;

                return (
                  <motion.button
                    key={command.id}
                    type="button"
                    onClick={() => handleSelectCommand(command)}
                    onMouseEnter={() => setSelectedIdx(currentIdx)}
                    whileHover={{ x: 4 }}
                    className={`w-full text-left px-3 py-2.5 rounded-md transition-colors flex items-start gap-3 ${
                      isSelected
                        ? 'bg-blue-100 dark:bg-blue-900/30'
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <div className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0">
                      {command.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-zinc-900 dark:text-white">
                          {command.name}
                        </p>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                          {command.example}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                        {command.description}
                      </p>
                    </div>
                    {isSelected && (
                      <ChevronRight className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
});
