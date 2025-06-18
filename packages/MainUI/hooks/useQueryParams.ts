"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

/**
 * Custom React hook that retrieves URL query parameters using Next.js's `useSearchParams`,
 * and returns them as a plain object with memoization.
 *
 * @template T - An optional generic type to enforce the expected shape of the query parameters.
 *
 * @returns {T} A plain object containing the current query parameters.
 *
 * @example
 * type Params = {
 *   userId?: string;
 *   filter?: string;
 * };
 *
 * const { userId, filter } = useQueryParams<Params>();
 */
export function useQueryParams<T extends Record<string, string | string[] | undefined>>(): T {
  const searchParams = useSearchParams();

  return useMemo<T>(() => {
    const entries = Array.from(searchParams.entries());
    const result: Record<string, string> = {};

    for (const [key, value] of entries) {
      result[key] = value;
    }

    if (!result.windowId) {
      for (const [key, value] of entries) {
        if (key.startsWith("w_") && value === "active") {
          result.windowId = key.slice(2);
          break;
        }
      }
    }

    return result as T;
  }, [searchParams]);
}
