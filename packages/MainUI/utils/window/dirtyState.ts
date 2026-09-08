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

import type { WindowState } from "@/utils/window/constants";

/**
 * Pure read layer over `windowStore.dirtyWindows`.
 *
 * The store keeps unsaved-changes flags as `{ [windowIdentifier]: { [sourceKey]: true } }`,
 * where a source key is `"<kind>:<tabId>"`. Building and reading those keys by hand
 * scattered the same string template and the same `Object.values(...).some(Boolean)`
 * across components, so every consumer goes through this module instead.
 */

/** Which part of a tab reported the unsaved changes. */
export const DIRTY_SOURCE_KINDS = {
  /** The tab's form view has changes react-hook-form considers dirty. */
  FORM: "form",
  /** The tab's grid has inline-edited rows with unsaved changes. */
  TABLE: "table",
} as const;

export type DirtySourceKind = (typeof DIRTY_SOURCE_KINDS)[keyof typeof DIRTY_SOURCE_KINDS];

/** Separator between the kind and the tab id inside a source key. */
const SOURCE_KEY_SEPARATOR = ":";

/** Prefix Classic puts in front of a tab title that has pending changes (`ob-standard-view.js`). */
export const DIRTY_TITLE_PREFIX = "* ";

export interface DirtySource {
  kind: DirtySourceKind;
  tabId: string;
}

export type DirtyWindows = Record<string, Record<string, boolean>>;

const DIRTY_SOURCE_KIND_VALUES: readonly string[] = Object.values(DIRTY_SOURCE_KINDS);

const isDirtySourceKind = (value: string): value is DirtySourceKind => DIRTY_SOURCE_KIND_VALUES.includes(value);

/** Builds the store key a tab reports its unsaved changes under. */
export const buildDirtySourceKey = (kind: DirtySourceKind, tabId: string): string =>
  `${kind}${SOURCE_KEY_SEPARATOR}${tabId}`;

/**
 * Splits a source key back into its kind and tab id.
 *
 * Tab ids never contain the separator, but splitting on the FIRST one keeps the
 * function total even if that ever changes.
 *
 * @returns `null` when the key is not a well-formed source key.
 */
export const parseDirtySourceKey = (key: string): DirtySource | null => {
  const separatorIndex = key.indexOf(SOURCE_KEY_SEPARATOR);
  if (separatorIndex <= 0) {
    return null;
  }
  const kind = key.substring(0, separatorIndex);
  const tabId = key.substring(separatorIndex + 1);
  if (!tabId || !isDirtySourceKind(kind)) {
    return null;
  }
  return { kind, tabId };
};

const hasAnyTruthyValue = (flags: Record<string, boolean> | undefined): boolean => {
  if (!flags) {
    return false;
  }
  return Object.values(flags).some(Boolean);
};

/** True when any source of the window reports unsaved changes. */
export const isWindowDirty = (dirtyWindows: DirtyWindows, windowIdentifier: string): boolean =>
  hasAnyTruthyValue(dirtyWindows[windowIdentifier]);

/** True when any source of that specific tab reports unsaved changes. */
export const isTabDirty = (dirtyWindows: DirtyWindows, windowIdentifier: string, tabId: string): boolean => {
  const windowSources = dirtyWindows[windowIdentifier];
  if (!windowSources) {
    return false;
  }
  return DIRTY_SOURCE_KIND_VALUES.some((kind) => windowSources[`${kind}${SOURCE_KEY_SEPARATOR}${tabId}`] === true);
};

/** True when at least one open window has unsaved changes. */
export const hasAnyDirty = (dirtyWindows: DirtyWindows): boolean => Object.values(dirtyWindows).some(hasAnyTruthyValue);

/** Identifiers of every window that currently has unsaved changes. */
export const getDirtyWindowIdentifiers = (dirtyWindows: DirtyWindows): string[] =>
  Object.keys(dirtyWindows).filter((windowIdentifier) => isWindowDirty(dirtyWindows, windowIdentifier));

/** Parsed sources of a window that report unsaved changes. */
export const getDirtySources = (dirtyWindows: DirtyWindows, windowIdentifier: string): DirtySource[] => {
  const windowSources = dirtyWindows[windowIdentifier];
  if (!windowSources) {
    return [];
  }
  const sources: DirtySource[] = [];
  for (const [key, isDirty] of Object.entries(windowSources)) {
    if (!isDirty) {
      continue;
    }
    const source = parseDirtySourceKey(key);
    if (source) {
      sources.push(source);
    }
  }
  return sources;
};

/** Tab level of a source, or a level that sorts last when the tab is unknown. */
const getSourceTabLevel = (source: DirtySource, window: WindowState | undefined): number => {
  const level = window?.tabs[source.tabId]?.level;
  if (typeof level === "number") {
    return level;
  }
  return Number.MAX_SAFE_INTEGER;
};

/**
 * Orders sources from the root tab down to the deepest child.
 *
 * Saving a child record needs its parent to exist already, so a bulk save has to
 * walk the hierarchy top-down.
 */
export const sortSourcesByTabLevel = (sources: DirtySource[], window: WindowState | undefined): DirtySource[] =>
  [...sources].sort((a, b) => getSourceTabLevel(a, window) - getSourceTabLevel(b, window));

/** Prefixes a tab or window title with the pending-changes marker. */
export const formatDirtyTitle = (title: string, isDirty: boolean): string => {
  if (isDirty) {
    return `${DIRTY_TITLE_PREFIX}${title}`;
  }
  return title;
};
