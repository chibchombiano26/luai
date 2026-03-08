// Simple IndexedDB store for quote payload configuration
import { JsonObject } from '@/lib/types/json';

const DB_NAME = 'PrevisosaQuoteStore';
const STORE_NAME = 'payloads';
const DB_VERSION = 1;

interface PayloadConfig {
  id: string;
  timestamp: number;
  overrides: JsonObject;
}

let dbInstance: IDBDatabase | null = null;

const getDB = async (): Promise<IDBDatabase> => {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const useQuotePayloadStore = () => {
  const savePayloadConfig = async (overrides: JsonObject) => {
    const db = await getDB();
    const store = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME);

    const config: PayloadConfig = {
      id: 'default',
      timestamp: Date.now(),
      overrides,
    };

    return new Promise<void>((resolve, reject) => {
      const request = store.put(config);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  };

  const getPayloadConfig = async (): Promise<JsonObject | null> => {
    const db = await getDB();
    const store = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get('default');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result as PayloadConfig | undefined;
        resolve(result?.overrides || null);
      };
    });
  };

  const clearPayloadConfig = async () => {
    const db = await getDB();
    const store = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME);

    return new Promise<void>((resolve, reject) => {
      const request = store.delete('default');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  };

  return {
    savePayloadConfig,
    getPayloadConfig,
    clearPayloadConfig,
  };
};
