import type { DataMode } from '@/core/domain/types';

const DEFAULT_DATA_MODE: DataMode = 'mock';

export function getDataMode(): DataMode {
  const rawMode = (import.meta.env.VITE_DATA_MODE ?? DEFAULT_DATA_MODE).toString().toLowerCase();
  return rawMode === 'supabase' ? 'supabase' : 'mock';
}

export function isMockMode(): boolean {
  return getDataMode() === 'mock';
}

export function isSupabaseMode(): boolean {
  return getDataMode() === 'supabase';
}
