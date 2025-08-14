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

"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { WINDOW_PREFIX, TAB_ACTIVE } from "@/utils/url/constants";

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
        if (key.startsWith(WINDOW_PREFIX) && value === TAB_ACTIVE) {
          result.windowId = key.slice(WINDOW_PREFIX.length);
          break;
        }
      }
    }

    return result as T;
  }, [searchParams]);
}
