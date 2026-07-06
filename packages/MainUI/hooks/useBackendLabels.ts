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

import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { Labels } from "@workspaceui/api-client/src/api/types";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";

/**
 * Loads the backend message dictionary (AD_MESSAGE labels) for the current
 * language so that label keys (e.g. the ones used by migrated process scripts
 * through `OB.I18N.getLabel`) can be resolved on the client.
 *
 * Fetching only runs once both a language and an auth token are available.
 * `Metadata.getLabels` is cached per language (the language is aligned by the
 * provider via `Metadata.setLanguage`), so revisits do not trigger redundant
 * requests. On failure the dictionary is left untouched, degrading to the
 * raw-key fallback rather than breaking the render.
 *
 * Returns the dictionary together with its setter so the language context can
 * keep exposing `setLabels`.
 */
export function useBackendLabels(
  language: string | null,
  token: string | null
): [Labels, Dispatch<SetStateAction<Labels>>] {
  const [labels, setLabels] = useState<Labels>({});

  useEffect(() => {
    if (!language || !token) {
      return;
    }

    let cancelled = false;
    Metadata.getLabels()
      .then((data) => {
        if (!cancelled) {
          setLabels(data);
        }
      })
      .catch((error) => {
        console.error("Failed to load labels", error);
      });

    return () => {
      cancelled = true;
    };
  }, [language, token]);

  return [labels, setLabels];
}
