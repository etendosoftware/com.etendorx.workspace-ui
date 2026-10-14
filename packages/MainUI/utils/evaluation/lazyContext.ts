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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import type { EvaluationContext } from "./buildEvaluationContext";

/**
 * Returns a getter that builds the context on its first call and reuses it afterwards.
 * A build that throws is not cached: the next call tries again, so the caller's try/catch fallback
 * applies and the next call retries.
 */
export const lazyContext = (build: () => EvaluationContext): (() => EvaluationContext) => {
  let built: EvaluationContext | undefined;
  return () => {
    if (built === undefined) built = build();
    return built;
  };
};

/** Same as {@link lazyContext}, one context per key object (e.g. one per selected record). */
export const lazyContextByKey = <K extends object>(
  build: (key: K) => EvaluationContext
): ((key: K) => EvaluationContext) => {
  const cache = new Map<K, EvaluationContext>();
  return (key: K) => {
    let built = cache.get(key);
    if (built === undefined) {
      built = build(key);
      cache.set(key, built);
    }
    return built;
  };
};
