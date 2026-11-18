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

import type { TranslationKeys } from "@workspaceui/componentlibrary/src/locales/types";

/** Resolvers needed to turn an ERP message code into user-facing text. */
export interface CatalogLabelResolvers {
  /** Resolves an ERP message code against the backend catalog; returns the code when unknown. */
  getLabel: (code: string) => string;
  /** Resolves a local translation key. */
  t: (key: TranslationKeys) => string;
}

/**
 * Resolves an `AD_MESSAGE` search key against the backend message catalog (served by `/meta/labels`),
 * as Classic does with `OB.I18N.getLabel`, falling back to a local translation when the catalog does
 * not define it.
 *
 * @param code the `AD_MESSAGE` search key
 * @param fallbackKey the local translation used when the catalog has no text for the code
 * @param resolvers the backend catalog and local translation resolvers
 * @returns the text to display
 */
export function resolveCatalogLabel(
  code: string,
  fallbackKey: TranslationKeys,
  { getLabel, t }: CatalogLabelResolvers
): string {
  const label = getLabel(code);
  if (label && label !== code) {
    return label;
  }
  return t(fallbackKey);
}
