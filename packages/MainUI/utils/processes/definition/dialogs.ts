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
 * Promise-based modal dialogs (`confirm` / `warn` / `say` / `ask`) for migrated
 * process scripts, plus an `isc` namespace shim for literal ports.
 *
 * The classic UI gates flow on a synchronous-looking modal: `confirm(message,
 * callback)` invokes the callback with `true` (OK) or `false` (Cancel/close);
 * `warn` / `say` show an informational dialog. These helpers reproduce that
 * surface without blocking the JS event loop: every call returns a Promise that
 * resolves when the user dismisses the dialog, and the classic callback shape is
 * still honoured.
 *
 * This module is React-free on purpose: it owns a small singleton request queue
 * (one dialog at a time, faithful to the classic single-modal behaviour) that a
 * React host (`ProcessDialogHost`) subscribes to and fulfils. Splitting the
 * imperative API from the renderer lets the API be injected by the pure
 * `buildProcessScriptContext` while the visual shell stays in the modal subtree.
 */

import { logger } from "@/utils/logger";

export type DialogKind = "confirm" | "warn" | "say";

/** Options accepted by the dialog helpers (classic Pattern B subset). */
export interface DialogOptions {
  /** Dialog title; falls back to a per-kind default supplied by the host. */
  title?: string;
}

/** Classic callback shape: receives `true` for OK, `false` for Cancel/close. */
export type DialogCallback = (result: boolean) => void;

/** A pending dialog awaiting the user's decision. */
export interface DialogRequest {
  id: number;
  kind: DialogKind;
  message: string;
  title?: string;
  resolve: (result: boolean) => void;
}

type Listener = () => void;

const queue: DialogRequest[] = [];
const listeners = new Set<Listener>();
let nextId = 1;

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

/** Subscribes a host to queue changes. Returns an unsubscribe function. */
export function subscribeDialogs(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The first pending dialog, or `undefined` when the queue is empty. */
export function peekDialog(): DialogRequest | undefined {
  return queue[0];
}

/** The full pending queue (read-only); primarily for tests. */
export function getDialogQueue(): readonly DialogRequest[] {
  return queue;
}

/** Resolves a specific dialog with the user's decision and advances the queue. */
export function resolveDialog(id: number, result: boolean): void {
  const index = queue.findIndex((request) => request.id === id);
  if (index === -1) return;
  const [request] = queue.splice(index, 1);
  request.resolve(result);
  notify();
}

/**
 * Resolves and clears every pending dialog with `result` (default `false`).
 * Called when the host unmounts (modal closed) so awaiting scripts never hang;
 * `false` is the safe default — it never confirms a destructive branch.
 */
export function clearDialogs(result = false): void {
  if (queue.length === 0) return;
  const pending = queue.splice(0, queue.length);
  for (const request of pending) {
    request.resolve(result);
  }
  notify();
}

function enqueue(kind: DialogKind, message: string, title?: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    // No host mounted → resolve to the safe default instead of hanging forever.
    if (listeners.size === 0) {
      logger.warn(`[dialogs] no dialog host mounted; "${kind}" auto-resolved to false`);
      resolve(false);
      return;
    }
    queue.push({ id: nextId++, kind, message, title, resolve });
    notify();
  });
}

/**
 * Normalizes the overloaded classic argument list. The second argument may be a
 * callback or an options object, with an optional trailing callback.
 */
function normalizeArgs(
  optionsOrCallback?: DialogOptions | DialogCallback,
  maybeCallback?: DialogCallback
): { options: DialogOptions; callback?: DialogCallback } {
  if (typeof optionsOrCallback === "function") {
    return { options: {}, callback: optionsOrCallback };
  }
  return {
    options: optionsOrCallback ?? {},
    callback: typeof maybeCallback === "function" ? maybeCallback : undefined,
  };
}

/**
 * Shows an OK/Cancel dialog. Resolves `true` on OK, `false` on Cancel/close.
 * Supports `confirm(message, callback)` and `confirm(message, options, callback)`
 * in addition to the awaited form.
 */
export function confirm(
  message: string,
  optionsOrCallback?: DialogOptions | DialogCallback,
  maybeCallback?: DialogCallback
): Promise<boolean> {
  const { options, callback } = normalizeArgs(optionsOrCallback, maybeCallback);
  const promise = enqueue("confirm", message, options.title);
  if (callback) promise.then((result) => callback(result));
  return promise;
}

/** Alias of {@link confirm} (classic `isc.ask`). */
export const ask = confirm;

/** Shows a warning dialog with a single acknowledge button. */
export function warn(
  message: string,
  optionsOrCallback?: DialogOptions | DialogCallback,
  maybeCallback?: DialogCallback
): Promise<void> {
  const { options, callback } = normalizeArgs(optionsOrCallback, maybeCallback);
  const promise = enqueue("warn", message, options.title);
  if (callback) promise.then((result) => callback(result));
  return promise.then(() => undefined);
}

/** Shows an informational dialog with a single acknowledge button. */
export function say(
  message: string,
  optionsOrCallback?: DialogOptions | DialogCallback,
  maybeCallback?: DialogCallback
): Promise<void> {
  const { options, callback } = normalizeArgs(optionsOrCallback, maybeCallback);
  const promise = enqueue("say", message, options.title);
  if (callback) promise.then((result) => callback(result));
  return promise.then(() => undefined);
}

/** Classic `isc` namespace shim, mirroring the standalone helpers. */
export const isc = { confirm, ask, warn, say };

/** Shape of the dialog helpers injected into the process script context. */
export interface DialogScriptApi {
  confirm: typeof confirm;
  warn: typeof warn;
  say: typeof say;
  isc: typeof isc;
}

/** The dialog helpers as a single object, ready to spread into the context. */
export const dialogScriptApi: DialogScriptApi = { confirm, warn, say, isc };
