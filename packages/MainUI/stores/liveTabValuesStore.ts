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

/**
 * Context the server computed for the record selected in a tab (auxiliary inputs, session attributes),
 * by a grid selection or by the record's form. Same shape as {@link LiveTabValues}.
 */
export type TabSelectionContext = LiveTabValues;

type EntriesByWindow<T> = Record<string, Record<string, T>>;

interface LiveTabValuesStore {
  /** `{ [windowIdentifier]: { [tabId]: LiveTabValues } }` */
  entries: EntriesByWindow<LiveTabValues>;
  /** `{ [windowIdentifier]: { [tabId]: TabSelectionContext } }`, kept when the form closes: it belongs to the record. */
  selectionEntries: EntriesByWindow<TabSelectionContext>;
  publishTabValues: (windowIdentifier: string, tabId: string, entry: LiveTabValues) => void;
  clearTabValues: (windowIdentifier: string, tabId: string) => void;
  publishSelectionContext: (windowIdentifier: string, tabId: string, entry: TabSelectionContext) => void;
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

/** The entries with `entry` set for the tab, or the very same object when it holds that entry already. */
const withEntry = (
  entries: EntriesByWindow<LiveTabValues>,
  windowIdentifier: string,
  tabId: string,
  entry: LiveTabValues
): EntriesByWindow<LiveTabValues> => {
  const windowEntries = entries[windowIdentifier] ?? {};
  if (isSameEntry(windowEntries[tabId], entry)) {
    return entries;
  }
  return { ...entries, [windowIdentifier]: { ...windowEntries, [tabId]: entry } };
};

/**
 * Values computed for the same record add up (like Classic's view form `auxInputs`, shared by the grid
 * selection and the form); values of another record replace them.
 */
const mergeSelectionContext = (
  current: TabSelectionContext | undefined,
  next: TabSelectionContext
): TabSelectionContext => {
  if (current?.recordId !== next.recordId) {
    return next;
  }
  return { recordId: next.recordId, values: { ...current.values, ...next.values } };
};

/**
 * Unsaved values of a tab's form that other parts of the window read before they are saved.
 *
 * The child tabs' display logic is evaluated outside the parent's form provider, so the
 * parent form publishes here the fields that logic depends on (Classic evaluates
 * `showTabIf` against the form context on every item change). The context the server computes
 * when a record is selected (auxiliary inputs, session attributes) is kept here too, per record.
 */
export const useLiveTabValuesStore = create<LiveTabValuesStore>()(
  devtools(
    (set) => ({
      entries: {},
      selectionEntries: {},
      publishTabValues: (windowIdentifier, tabId, entry) =>
        set(
          (state) => {
            const entries = withEntry(state.entries, windowIdentifier, tabId, entry);
            return entries === state.entries ? state : { entries };
          },
          false,
          "liveTabValues/publishTabValues"
        ),
      publishSelectionContext: (windowIdentifier, tabId, entry) =>
        set(
          (state) => {
            const current = state.selectionEntries[windowIdentifier]?.[tabId];
            const merged = mergeSelectionContext(current, entry);
            const selectionEntries = withEntry(state.selectionEntries, windowIdentifier, tabId, merged);
            return selectionEntries === state.selectionEntries ? state : { selectionEntries };
          },
          false,
          "liveTabValues/publishSelectionContext"
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
