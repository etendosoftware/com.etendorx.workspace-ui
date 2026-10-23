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

import {
  deleteFormPersonalization,
  fetchFormPersonalization,
  type FormPersonalizationState,
  type SaveFormPersonalizationParams,
  saveFormPersonalization,
} from "@workspaceui/api-client/src/api/formPersonalization";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type FormPersonalizationStatus = "loading" | "ready" | "error";

interface FormPersonalizationEntry {
  status: FormPersonalizationStatus;
  state?: FormPersonalizationState;
}

interface FormPersonalizationStore {
  /** One entry per role, organization and tab: the personalization that applies depends on all three. */
  entries: Record<string, FormPersonalizationEntry>;
  /** Loads the personalization of a tab once; pass `force` to read it again. */
  load: (key: string, tabId: string, force?: boolean) => Promise<void>;
  /** Stores a personalization and reads back the one that applies, which may be another level's. */
  save: (key: string, params: SaveFormPersonalizationParams) => Promise<void>;
  /** Discards a personalization and reads back the one that applies, if any. */
  remove: (key: string, tabId: string, id: string) => Promise<void>;
  reset: () => void;
}

const inFlight = new Map<string, Promise<void>>();

export const formPersonalizationKey = (roleId: string, orgId: string, tabId: string): string =>
  `${roleId}|${orgId}|${tabId}`;

export const useFormPersonalizationStore = create<FormPersonalizationStore>()(
  devtools(
    (set, get) => {
      const read = async (key: string, tabId: string): Promise<void> => {
        try {
          const state = await fetchFormPersonalization(tabId);
          set((s) => ({ entries: { ...s.entries, [key]: { status: "ready", state } } }), false, "load/ready");
        } catch {
          // Without it the form simply keeps the layout defined in the dictionary.
          set((s) => ({ entries: { ...s.entries, [key]: { status: "error" } } }), false, "load/error");
        }
      };

      return {
        entries: {},

        load: (key, tabId, force = false) => {
          const pending = inFlight.get(key);
          if (pending) {
            return pending;
          }
          if (!force && get().entries[key]) {
            return Promise.resolve();
          }
          set((s) => ({ entries: { ...s.entries, [key]: { ...s.entries[key], status: "loading" } } }), false, "load");
          const request = read(key, tabId).finally(() => inFlight.delete(key));
          inFlight.set(key, request);
          return request;
        },

        save: async (key, params) => {
          await saveFormPersonalization(params);
          await get().load(key, params.tabId, true);
        },

        remove: async (key, tabId, id) => {
          await deleteFormPersonalization(id);
          await get().load(key, tabId, true);
        },

        reset: () => {
          inFlight.clear();
          set({ entries: {} }, false, "reset");
        },
      };
    },
    { name: "FormPersonalizationStore" }
  )
);
