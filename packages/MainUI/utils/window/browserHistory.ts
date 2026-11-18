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

import { findDeepestFormViewTab, isFormViewTabEntry } from "@/utils/url/utils";
import { FORM_MODES, TAB_MODES } from "@/utils/url/constants";
import { isWindowDirty, type DirtyWindows } from "@/utils/window/dirtyState";
import type { WindowState } from "@/utils/window/constants";
import { useWindowStore } from "@/stores/windowStore";

/**
 * Browser Back/Forward support.
 *
 * The URL only mirrors which windows are open, so it cannot tell two navigation steps apart. Each
 * history entry therefore carries a small marker in `history.state` describing the step it stands
 * for: which window was in front and which record form was open in it. A step is pushed when the
 * user moves somewhere new (opening or activating a window, opening or leaving a record form) and
 * restored when the user comes back to it with the browser buttons.
 */

/** Key under which the marker is stored in `history.state` (next to Next.js's own fields). */
export const HISTORY_STATE_KEY = "etendoNavigation";

/** Record form that was open in the window in front. */
export interface NavigationForm {
  tabId: string;
  recordId: string;
  /** Tab level, needed to select the record again. */
  level: number;
}

/** What the user was looking at: the window in front (null = home) and its open record form. */
export interface NavigationStep {
  activeWindowIdentifier: string | null;
  form: NavigationForm | null;
}

/** A step plus its position in the entries this session pushed, so the direction of a pop is known. */
export interface NavigationEntry extends NavigationStep {
  index: number;
}

/** What the sync has to do with the browser history after the store changed. */
export type HistoryWrite = "push" | "replace" | "none";

/** What a Back/Forward movement has to do with the window store. */
export type RestorePlan =
  | { kind: "home" }
  | { kind: "skip" }
  | { kind: "restore"; step: NavigationStep & { activeWindowIdentifier: string } };

/** Derives the current step from the windows in the store. */
export const buildNavigationStep = (windows: WindowState[]): NavigationStep => {
  const active = windows.find((window) => window.isActive);
  if (!active) {
    return { activeWindowIdentifier: null, form: null };
  }

  const deepest = findDeepestFormViewTab(active);
  return {
    activeWindowIdentifier: active.windowIdentifier,
    form: deepest ? { tabId: deepest[0], recordId: deepest[1].selectedRecord, level: deepest[1].level } : null,
  };
};

/** Two steps are the same place when they show the same window and the same record form. */
export const isSameStep = (a: NavigationStep, b: NavigationStep): boolean =>
  a.activeWindowIdentifier === b.activeWindowIdentifier &&
  a.form?.tabId === b.form?.tabId &&
  a.form?.recordId === b.form?.recordId;

/**
 * Decides how a change in the store is reflected in the browser history.
 *
 * - The first step only tags the entry the user landed on.
 * - Closing a window never adds an entry: it rewrites the current one, so Back does not "reopen" it.
 * - Anything else that changes the step is a new place and adds an entry.
 */
export const resolveHistoryWrite = (
  previous: NavigationEntry | null,
  next: NavigationStep,
  windowCount: number,
  previousWindowCount: number
): HistoryWrite => {
  if (!previous) {
    return "replace";
  }
  if (isSameStep(previous, next)) {
    return "none";
  }
  return windowCount < previousWindowCount ? "replace" : "push";
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

/** Reads the marker out of a `history.state`, or null when the entry was not written by this module. */
export const readNavigationEntry = (state: unknown): NavigationEntry | null => {
  if (!isRecord(state)) {
    return null;
  }
  const entry = state[HISTORY_STATE_KEY];
  if (!isRecord(entry) || typeof entry.index !== "number") {
    return null;
  }
  return entry as unknown as NavigationEntry;
};

/**
 * Keys with which Next.js marks the history entries it writes itself. Its patched `pushState` and
 * `replaceState` skip syncing the router (so `useSearchParams` keeps the old URL) for any state that
 * carries them, so they must not be copied into what this module writes.
 */
const NEXT_OWN_STATE_KEYS = ["__NA", "_N"];

/**
 * Copies a `history.state` adding the marker. Next.js adds its own internals back when it handles the
 * write, as long as the state does not claim to come from Next.js already.
 */
export const withNavigationEntry = (state: unknown, entry: NavigationEntry): Record<string, unknown> => {
  const copy: Record<string, unknown> = { ...(isRecord(state) ? state : {}) };
  for (const key of NEXT_OWN_STATE_KEYS) {
    delete copy[key];
  }
  return { ...copy, [HISTORY_STATE_KEY]: entry };
};

/**
 * Tells whether going to a step would drop the record form of a window that has unsaved changes.
 * Activating another window is always safe: windows keep their own state.
 */
export const wouldDiscardUnsavedForm = (
  step: NavigationStep,
  windows: Record<string, WindowState>,
  dirtyWindows: DirtyWindows
): boolean => {
  const target = step.activeWindowIdentifier ? windows[step.activeWindowIdentifier] : undefined;
  if (!target || !isWindowDirty(dirtyWindows, target.windowIdentifier)) {
    return false;
  }
  const current = buildNavigationStep([target]);
  return !isSameStep({ ...current, activeWindowIdentifier: target.windowIdentifier }, step);
};

/**
 * Decides what a Back/Forward movement means for the windows currently open.
 * An entry that points to a window closed in the meantime is skipped.
 */
export const planRestore = (entry: NavigationStep, windows: Record<string, WindowState>): RestorePlan => {
  if (entry.activeWindowIdentifier === null) {
    return { kind: "home" };
  }
  if (!windows[entry.activeWindowIdentifier]) {
    return { kind: "skip" };
  }
  return { kind: "restore", step: { ...entry, activeWindowIdentifier: entry.activeWindowIdentifier } };
};

/** Brings the window store to the step: window in front, then the record form of that window. */
export const applyNavigationStep = (step: NavigationStep): void => {
  const store = useWindowStore.getState();

  if (step.activeWindowIdentifier === null) {
    store.setAllWindowsInactive();
    return;
  }

  const windowIdentifier = step.activeWindowIdentifier;
  store.setWindowActive({ windowIdentifier });

  const target = useWindowStore.getState().windows[windowIdentifier];
  if (!target) {
    return;
  }

  // Leave the forms that are open deeper than the one the step shows (all of them when it shows none).
  for (const entry of Object.entries(target.tabs)) {
    if (isFormViewTabEntry(entry) && entry[1].level > (step.form?.level ?? -1)) {
      store.clearTabFormState(windowIdentifier, entry[0]);
    }
  }

  if (!step.form) {
    return;
  }

  const { tabId, recordId, level } = step.form;
  const tabState = target.tabs[tabId];
  const isAlreadyOpen = tabState?.form?.mode === TAB_MODES.FORM && tabState.form.recordId === recordId;
  if (isAlreadyOpen) {
    return;
  }

  store.setSelectedRecord(windowIdentifier, tabId, recordId, level);
  store.setTabFormState(windowIdentifier, tabId, { recordId, mode: TAB_MODES.FORM, formMode: FORM_MODES.EDIT }, level);
};
