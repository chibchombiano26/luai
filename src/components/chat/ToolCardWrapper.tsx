'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown } from 'lucide-react';

interface ToolCardWrapperProps {
  children: React.ReactNode;
  onRemove: () => void;
  defaultExpanded?: boolean;
  title?: string;
}

export function ToolCardWrapper({
  children,
  onRemove,
  defaultExpanded = true,
  title,
}: ToolCardWrapperProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group"
    >
      {/* Collapsed Header */}
      {!isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg flex items-center justify-between"
        >
          <button
            onClick={() => setIsExpanded(true)}
            className="flex-1 text-left flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 px-2 py-1 rounded transition-colors"
          >
            <ChevronDown className="w-4 h-4 text-zinc-600 dark:text-zinc-400 transform -rotate-90" />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {title || 'Card'}
            </span>
          </button>
          <button
            onClick={onRemove}
            className="p-2 text-zinc-500 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors hover:text-red-600 dark:hover:text-red-400"
            title="Eliminar"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            {/* Control Buttons - Always visible for better mobile UX */}
            <div className="absolute top-3 right-3 z-10 flex gap-1.5">
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition-colors hover:text-zinc-700 dark:hover:text-zinc-300"
                title="Comprimir"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                onClick={onRemove}
                className="p-2 text-zinc-500 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors hover:text-red-600 dark:hover:text-red-400"
                title="Eliminar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Card Content */}
            <div className="pr-12 sm:pr-20">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
