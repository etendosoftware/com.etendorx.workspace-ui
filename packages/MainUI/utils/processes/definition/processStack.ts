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
import type { OpenProcessParams } from "@/utils/processes/definition/scriptProxies";

/** Method name exposed on the script-facing view; reused by the proxy wiring. */
export const OPEN_PROCESS = "openProcess";

/** Classic alias namespace (`view.standardWindow.openProcess`). */
export const STANDARD_WINDOW = "standardWindow";

/** A queued nested-process launch awaiting a host to render it. */
export interface OpenProcessRequest extends OpenProcessParams {
  id: number;
  /** Fired after the entry is popped (the launcher's parent-view refresh). */
  onClose?: () => void;
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
export function pushProcess(request: OpenProcessParams & { onClose?: () => void }): number {
  const id = nextId++;
  stack.push({ ...request, id });
  if (listeners.size === 0) {
    logger.warn("[processStack] no host mounted; openProcess request enqueued without a renderer");
  }
  commit();
  return id;
}

/** Removes the entry with the given id (no-op when not found). */
export function popProcess(id: number): void {
  const index = stack.findIndex((request) => request.id === id);
  if (index === -1) return;
  stack.splice(index, 1);
  commit();
}

/** Empties the stack (called when the host unmounts). No-op when already empty. */
export function clearProcessStack(): void {
  if (stack.length === 0) return;
  stack.length = 0;
  commit();
}
