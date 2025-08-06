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

import { useCallback, useEffect, useRef } from "react";

interface PromiseRef<T> {
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
}

/**
 * Hook personalizado para realizar debounce de una función asíncrona
 * Similar a _.debounce de lodash pero como un hook de React
 * Soporta funciones que devuelven promesas
 *
 * @template T - Tipo del valor devuelto por la función
 * @template Args - Tipos de argumentos que recibe la función
 * @param {(...args: Args) => Promise<T> | T} fn - La función a ejecutar con debounce
 * @param {number} delay - Tiempo de espera en milisegundos
 * @param {DependencyList} deps - Dependencias adicionales
 * @returns {(...args: Args) => Promise<T>} - Función con debounce aplicado que devuelve una promesa
 */
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
function useDebounce<T, Args extends any[] = any[]>(fn: ((...args: Args) => Promise<T> | T) | undefined, delay = 500) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const latestPromiseRef = useRef<PromiseRef<T> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Args): Promise<T> | undefined => {
      if (!fn) return undefined;
      // Creamos una nueva promesa
      const promiseRef: PromiseRef<T> = {} as PromiseRef<T>;
      const promise = new Promise<T>((resolve, reject) => {
        promiseRef.resolve = resolve;
        promiseRef.reject = reject;
      });

      latestPromiseRef.current = promiseRef;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        if (latestPromiseRef.current === promiseRef) {
          Promise.resolve(fn(...args))
            .then((result) => promiseRef.resolve(result))
            .catch((err) => promiseRef.reject(err));
        }
      }, delay);

      return promise;
    },
    [fn, delay]
  );
}

export { useDebounce };

export default useDebounce;
