import { useState, useEffect, useCallback, useRef } from 'react';
import type { AppData } from '../types';
import { sanityClient } from '../lib/sanityClient';

const DOC_ID = 'muckSavageData';
const POLL_INTERVAL = 10000;

const DEFAULT_DATA: AppData = {
  songs: [],
  setLists: [],
  bandName: 'Muck Savage',
};

async function fetchFromSanity(): Promise<AppData | null> {
  const doc = await sanityClient.fetch(
    `*[_id == $id][0]{ songs, setLists, bandName }`,
    { id: DOC_ID }
  );
  return doc ?? null;
}

async function saveToSanity(data: AppData): Promise<void> {
  await sanityClient.createOrReplace({
    _id: DOC_ID,
    _type: 'bandData',
    songs: data.songs,
    setLists: data.setLists,
    bandName: data.bandName,
  });
}

export function useSharedData() {
  const [data, setData] = useState<AppData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const lastSaved = useRef<string>('');

  const loadData = useCallback(async () => {
    try {
      const remote = await fetchFromSanity();
      if (remote) {
        const serialized = JSON.stringify(remote);
        if (serialized !== lastSaved.current) {
          lastSaved.current = serialized;
          setData(remote);
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
      await saveToSanity(newData);
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