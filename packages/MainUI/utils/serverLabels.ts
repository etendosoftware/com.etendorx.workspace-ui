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

import { fetchServerLabel } from "@workspaceui/api-client/src/api/serverLabel";
import { registerSessionReset } from "@/utils/session/resetSessionState";
import { logger } from "@/utils/logger";

/** Texts already asked for in this session, by language and key: each message is requested once. */
const cache = new Map<string, Promise<string | undefined>>();

// The texts belong to the session that is closing (its language)
registerSessionReset(() => cache.clear());

/**
 * Translated text of an AD_Message that is not in the label catalog of the session, read once per session
 * and language as classic `OB.I18N.getLabelFromServer` does. A failed request is forgotten so it is retried.
 *
 * @param language - Language of the session, part of the cache key
 * @param key - Search key of the message
 * @returns The text, or `undefined` when the message does not exist or cannot be read
 */
export function loadServerLabel(language: string, key: string): Promise<string | undefined> {
  const cacheKey = `${language}|${key}`;
  let label = cache.get(cacheKey);
  if (!label) {
    label = fetchServerLabel(key).catch((error) => {
      cache.delete(cacheKey);
      logger.warn(`Could not read the message ${key}:`, error);
      return undefined;
    });
    cache.set(cacheKey, label);
  }
  return label;
}
