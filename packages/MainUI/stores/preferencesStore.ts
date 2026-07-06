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

import { create } from "zustand";
import { devtools } from "zustand/middleware";

export const FAVICON_BADGE_KEY = "settings.favicon_badge";

interface PreferencesStore {
  customFaviconColor: string | null;
  setCustomFaviconColor: (color: string | null) => void;
}

export const usePreferencesStore = create<PreferencesStore>()(
  devtools(
    (set) => ({
      // Starts null — PreferencesProvider hydrates from localStorage on mount.
      customFaviconColor: null,
      setCustomFaviconColor: (color: string | null) => {
        if (typeof window !== "undefined") {
          if (color) {
            localStorage.setItem(FAVICON_BADGE_KEY, color);
          } else {
            localStorage.removeItem(FAVICON_BADGE_KEY);
          }
        }
        set({ customFaviconColor: color });
      },
    }),
    { name: "PreferencesStore" }
  )
);
