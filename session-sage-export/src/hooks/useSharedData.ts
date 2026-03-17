import { useState, useEffect, useCallback, useRef } from 'react';
import type { AppData } from '../types';

const STORAGE_KEY = 'session-sage-data';
const POLL_INTERVAL = 5000;

const DEFAULT_DATA: AppData = {
  songs: [],
  setLists: [],
  bandName: 'Our Band',
};

// Use window.storage (artifact persistent storage) if available, else localStorage fallback
const storage = {
  async get(key: string): Promise<string | null> {
    if ((window as any).storage) {
      try {
        const result = await (window as any).storage.get(key, true);
        return result?.value ?? null;
      } catch {
        return null;
      }
    }
    return localStorage.getItem(key);
  },
  async set(key: string, value: string): Promise<void> {
    if ((window as any).storage) {
      try {
        await (window as any).storage.set(key, value, true);
      } catch {
        localStorage.setItem(key, value);
      }
    } else {
      localStorage.setItem(key, value);
    }
  },
};

export function useSharedData() {
  const [data, setData] = useState<AppData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const lastSaved = useRef<string>('');

  const loadData = useCallback(async () => {
    try {
      const raw = await storage.get(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppData;
        const serialized = JSON.stringify(parsed);
        if (serialized !== lastSaved.current) {
          lastSaved.current = serialized;
          setData(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveData = useCallback(async (newData: AppData) => {
    const serialized = JSON.stringify(newData);
    lastSaved.current = serialized;
    setData(newData);
    try {
      await storage.set(STORAGE_KEY, serialized);
    } catch (e) {
      console.error('Failed to save data:', e);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [loadData]);

  return { data, saveData, loading };
}
