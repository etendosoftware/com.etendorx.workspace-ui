import { useState, useEffect, useRef } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const manager = useState<T>(initialValue);
  const [storedValue, setStoredValue] = manager;
  const ready = useRef(false);

  useEffect(() => {
    const item = localStorage.getItem(key);
    if (item) {
      setStoredValue(JSON.parse(item));
    }
  }, [key, setStoredValue]);

  useEffect(() => {
    if (ready.current) {
      localStorage.setItem(key, JSON.stringify(storedValue));
    } else {
      ready.current = true;
    }
  }, [key, storedValue]);

  return manager;
}
