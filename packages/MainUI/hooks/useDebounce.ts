import { useCallback, useEffect, useRef } from 'react';

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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useDebounce<T, Args extends any[] = any[]>(
  fn: ((...args: Args) => Promise<T> | T) | undefined,
  delay: number = 500,
) {
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
            .then(result => promiseRef.resolve(result))
            .catch(err => promiseRef.reject(err));
        }
      }, delay);

      return promise;
    },
    [fn, delay],
  );
}

export { useDebounce };

export default useDebounce;
