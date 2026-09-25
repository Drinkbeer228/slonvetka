import { useState, useEffect, Dispatch, SetStateAction } from 'react';

/**
 * Custom hook for persistent state in localStorage with resilient JSON parsing
 * and fallback support for mobile Safari background reloads.
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  fallbackKeys?: string[]
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        return JSON.parse(saved);
      }
      if (fallbackKeys && fallbackKeys.length > 0) {
        for (const altKey of fallbackKeys) {
          const altSaved = localStorage.getItem(altKey);
          if (altSaved !== null) {
            return JSON.parse(altSaved);
          }
        }
      }
      return defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (err) {
      console.warn(`[useLocalStorage] Failed to persist key "${key}":`, err);
    }
  }, [key, state]);

  return [state, setState];
}
