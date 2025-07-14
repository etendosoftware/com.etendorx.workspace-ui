import { useCallback, useEffect, useState } from "react";

const isBrowser = typeof window !== "undefined";

const getStoredValue = <T>(key: string, initialValue: T | (() => T)): T => {
  if (!isBrowser) {
    return typeof initialValue === "function" ? (initialValue as () => T)() : initialValue;
  }

  try {
    const storedValue = window.localStorage.getItem(key);
    if (storedValue !== null) {
      return JSON.parse(storedValue) as T;
    }
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
  }

  return typeof initialValue === "function" ? (initialValue as () => T)() : initialValue;
};

const useLocalStorage = <T>(key: string, initialValue: T | (() => T)) => {
  const [state, setState] = useState<T>(() => getStoredValue(key, initialValue));

  const setValue = useCallback(
    (value: T | ((prevState: T) => T)) => {
      setState((prevState) => {
        const newValue = typeof value === "function" ? (value as (prev: T) => T)(prevState) : value;

        if (isBrowser) {
          try {
            if (newValue === undefined) {
              window.localStorage.removeItem(key);
            } else {
              window.localStorage.setItem(key, JSON.stringify(newValue));
            }
          } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
          }
        }

        return newValue;
      });
    },
    [key]
  );

  useEffect(() => {
    if (!isBrowser) return;

    try {
      const storedValue = window.localStorage.getItem(key);
      if (storedValue !== null) {
        setState(JSON.parse(storedValue));
      }
    } catch (error) {
      console.warn(`Error syncing localStorage key "${key}":`, error);
    }
  }, [key]);

  return [state, setValue] as const;
};

export default useLocalStorage;

export { useLocalStorage };
