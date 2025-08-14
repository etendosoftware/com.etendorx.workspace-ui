/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

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
