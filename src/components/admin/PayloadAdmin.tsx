'use client';

import { useCallback, useState } from 'react';
import { Settings, X, Save, Trash2 } from 'lucide-react';
import {
  LEGACY_PAYLOAD_OVERRIDES_STORAGE_KEYS,
  PAYLOAD_OVERRIDES_STORAGE_KEY,
} from '@/hooks/usePayloadOverrides';
import {
  getCompatStorageItem,
  removeCompatStorageItem,
  setCompatStorageItem,
} from '@/lib/browser-storage';

export function PayloadAdmin() {
  const [isOpen, setIsOpen] = useState(false);
  const [overrides, setOverrides] = useState<string>('{}');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadConfig = useCallback(() => {
    try {
      const stored = getCompatStorageItem(
        localStorage,
        PAYLOAD_OVERRIDES_STORAGE_KEY,
        LEGACY_PAYLOAD_OVERRIDES_STORAGE_KEYS
      );
      setOverrides(JSON.stringify(stored ? JSON.parse(stored) : {}, null, 2));
      setError('');
    } catch (err) {
      setError('Failed to load configuration');
      console.error(err);
    }
  }, []);

  const handleOpen = useCallback(() => {
    loadConfig();
    setIsOpen(true);
  }, [loadConfig]);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(overrides);
      setCompatStorageItem(
        localStorage,
        PAYLOAD_OVERRIDES_STORAGE_KEY,
        JSON.stringify(parsed),
        LEGACY_PAYLOAD_OVERRIDES_STORAGE_KEYS
      );
      setSuccess('Configuration saved ✓');
      setTimeout(() => setSuccess(''), 3000);
      setError('');
    } catch (err) {
      setError('Invalid JSON. Check the format.');
      console.error(err);
    }
  };

  const handleClear = () => {
    try {
      removeCompatStorageItem(
        localStorage,
        PAYLOAD_OVERRIDES_STORAGE_KEY,
        LEGACY_PAYLOAD_OVERRIDES_STORAGE_KEYS
      );
      setOverrides('{}');
      setSuccess('Configuration cleared ✓');
      setTimeout(() => setSuccess(''), 3000);
      setError('');
    } catch (err) {
      setError('Failed to clear configuration');
      console.error(err);
    }
  };

  return (
    <>
      {/* Floating button to open admin */}
      <button
        onClick={handleOpen}
        className="fixed bottom-4 right-4 w-12 h-12 bg-gray-800 hover:bg-gray-900 text-white rounded-full flex items-center justify-center shadow-lg transition-colors z-40"
        title="Admin - Override payload"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Admin modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-700">
              <h2 className="text-xl font-bold dark:text-white">Admin - Configure payload</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
              >
                <X className="w-5 h-5 dark:text-zinc-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Edit the parameters that are overridden during quotes. Changes are saved in the browser&apos;s local storage.
              </p>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-400">
                  ⚠️ {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-sm text-green-700 dark:text-green-400">
                  ✓ {success}
                </div>
              )}

              <textarea
                value={overrides}
                onChange={(e) => setOverrides(e.target.value)}
                className="w-full h-80 p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg font-mono text-sm dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder='{"VehicleYear": 2020, ...}'
              />

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3 text-xs text-blue-700 dark:text-blue-400">
                <p className="font-semibold mb-1">💡 Override example:</p>
                <pre className="overflow-x-auto">
{`{
  "VehicleYear": 2020,
  "VehiclePrice": 25000000,
  "RiskQuotation": {
    "RatingZoneCode": 3
  }
}`}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-zinc-200 dark:border-zinc-700">
              <button
                onClick={handleClear}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>

              <div className="flex-1" />

              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>

              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
