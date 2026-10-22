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

/**
 * React-free singleton stack of nested-process launch requests for migrated
 * scripts. A script calls `view.openProcess(params)` (or the classic
 * `view.standardWindow.openProcess`) to layer another process modal on top of
 * the current one; the call pushes a request here and a React host
 * (`ProcessStackHost`) subscribes to render one modal per entry.
 *
 * This mirrors the dialog queue in `dialogs.ts`: the imperative surface stays
 * out of React so it can be injected into the pure script context, while the
 * visual shell lives in the modal subtree. The stack is LIFO; closing the top
 * popup pops its entry and fires the launcher's refresh callback.
 */

import { logger } from "@/utils/logger";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import type Graph from "@/data/graph";
import type { OpenProcessParams } from "@/utils/processes/definition/scriptProxies";

/** Method name exposed on the script-facing view; reused by the proxy wiring. */
export const OPEN_PROCESS = "openProcess";

/** Classic alias namespace (`view.standardWindow.openProcess`). */
export const STANDARD_WINDOW = "standardWindow";

/** A nested-process launch as pushed by the launcher (before it gets an id). */
export interface OpenProcessLaunch extends OpenProcessParams {
  /** Fired once when the entry is closed without success (X / Cancel). */
  onClose?: () => void;
  /** Fired once when the entry is closed after a successful execution (the launcher's refresh). */
  onSuccess?: () => void;
  /**
   * The tab (and its record) that launched the outermost process. A nested process runs in its
   * context, as Classic's `buttonOwnerView`, since the stack host renders outside any tab.
   */
  ownerTab?: Tab;
  ownerRecord?: Record<string, unknown>;
  /** The owner's tab selection graph, so the nested modal reads the same selection (session context). */
  ownerGraph?: Graph<Tab>;
}

/** A queued nested-process launch awaiting a host to render it. */
export interface OpenProcessRequest extends OpenProcessLaunch {
  id: number;
}

const stack: OpenProcessRequest[] = [];
const listeners = new Set<() => void>();
let nextId = 1;

// Cached snapshot for useSyncExternalStore: the getter must return the SAME
// reference until the stack actually changes, otherwise React loops forever.
// It is reassigned only inside commit(), never inside the getter.
let snapshot: readonly OpenProcessRequest[] = [];

function commit(): void {
  snapshot = stack.slice();
  for (const listener of listeners) {
    listener();
  }
}

/** Subscribes a host to stack changes. Returns an unsubscribe function. */
export function subscribeProcessStack(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Stable snapshot of the stack (same reference until a mutation). */
export function getProcessStack(): readonly OpenProcessRequest[] {
  return snapshot;
}

/** Pushes a launch request onto the stack and returns its id. */
export function pushProcess(request: OpenProcessLaunch): number {
  const id = nextId++;
  stack.push({ ...request, id });
  if (listeners.size === 0) {
    logger.warn("[processStack] no host mounted; openProcess request enqueued without a renderer");
  }
  commit();
  return id;
}

/** Removes the entry with the given id. Returns whether it was in the stack (no-op otherwise). */
export function popProcess(id: number): boolean {
  const index = stack.findIndex((request) => request.id === id);
  if (index === -1) return false;
  stack.splice(index, 1);
  commit();
  return true;
}

/**
 * Whether a process modal is the topmost one, the only one that may render the
 * shared script dialogs (`confirm`, `warn`, …). A modal outside the stack
 * (`stackEntryId` undefined) is topmost while no nested process is open; a
 * nested one is topmost when it is the last stack entry.
 */
export function isTopmostProcessModal(stackSnapshot: readonly OpenProcessRequest[], stackEntryId?: number): boolean {
  if (stackEntryId === undefined) return stackSnapshot.length === 0;
  return stackSnapshot.at(-1)?.id === stackEntryId;
}

/** Empties the stack (called when the host unmounts). No-op when already empty. */
export function clearProcessStack(): void {
  if (stack.length === 0) return;
  stack.length = 0;
  commit();
}
