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

import type { LabelParams, OBI18N, OBShimDeps } from "./types";

/**
 * Applies classic positional substitution to a label template: each `%n`
 * placeholder is replaced (first occurrence only, mirroring SmartClient's
 * `label.replace('%' + i, params[i])`).
 */
function substituteParams(template: string, params?: LabelParams): string {
  if (!params || params.length === 0) {
    return template;
  }
  let label = template;
  for (let i = 0; i < params.length; i++) {
    label = label.replace(`%${i}`, String(params[i]));
  }
  return label;
}

/**
 * Builds the `OB.I18N` namespace.
 *
 * `getLabel(key, params)` resolves the template via `deps.getLabel` (the
 * language-context dictionary, already cached per language) and applies `%n`
 * substitution. When no resolver is provided, or the key is unknown, the key is
 * returned unchanged — matching the new UI's identity fallback convention
 * rather than classic's `"UNDEFINED <key>"`.
 */
export function createI18N(deps: OBShimDeps = {}): OBI18N {
  const resolve = deps.getLabel ?? ((key: string) => key);
  return {
    getLabel: (key: string, params?: LabelParams): string => substituteParams(resolve(key), params),
  };
}
