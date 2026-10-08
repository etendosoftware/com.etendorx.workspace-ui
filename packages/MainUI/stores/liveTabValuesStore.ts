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

import { create } from "zustand";
import { devtools } from "zustand/middleware";

/** Values a tab's form is showing right now, tied to the record they belong to. */
export interface LiveTabValues {
  recordId: string;
  values: Record<string, unknown>;
}

type LiveTabValuesEntries = Record<string, Record<string, LiveTabValues>>;

interface LiveTabValuesStore {
  /** `{ [windowIdentifier]: { [tabId]: LiveTabValues } }` */
  entries: LiveTabValuesEntries;
  publishTabValues: (windowIdentifier: string, tabId: string, entry: LiveTabValues) => void;
  clearTabValues: (windowIdentifier: string, tabId: string) => void;
}

const haveSameValues = (a: Record<string, unknown>, b: Record<string, unknown>): boolean => {
  const aKeys = Object.keys(a);
  if (aKeys.length !== Object.keys(b).length) {
    return false;
  }
  return aKeys.every((key) => Object.is(a[key], b[key]));
};

const isSameEntry = (current: LiveTabValues | undefined, next: LiveTabValues): boolean =>
  current?.recordId === next.recordId && haveSameValues(current.values, next.values);

/**
 * Unsaved values of a tab's form that other parts of the window read before they are saved.
 *
 * The child tabs' display logic is evaluated outside the parent's form provider, so the
 * parent form publishes here the fields that logic depends on (Classic evaluates
 * `showTabIf` against the form context on every item change).
 */
export const useLiveTabValuesStore = create<LiveTabValuesStore>()(
  devtools(
    (set) => ({
      entries: {},
      publishTabValues: (windowIdentifier, tabId, entry) =>
        set(
          (state) => {
            const windowEntries = state.entries[windowIdentifier] ?? {};
            if (isSameEntry(windowEntries[tabId], entry)) {
              return state;
            }
            return { entries: { ...state.entries, [windowIdentifier]: { ...windowEntries, [tabId]: entry } } };
          },
          false,
          "liveTabValues/publishTabValues"
        ),
      clearTabValues: (windowIdentifier, tabId) =>
        set(
          (state) => {
            const windowEntries = state.entries[windowIdentifier];
            if (!windowEntries?.[tabId]) {
              return state;
            }
            const remaining = Object.fromEntries(Object.entries(windowEntries).filter(([id]) => id !== tabId));
            return { entries: { ...state.entries, [windowIdentifier]: remaining } };
          },
          false,
          "liveTabValues/clearTabValues"
        ),
    }),
    { name: "LiveTabValuesStore" }
  )
);
