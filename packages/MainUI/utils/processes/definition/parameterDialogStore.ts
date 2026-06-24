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
 * Promise-based, action-time dynamic parameter dialog for migrated process
 * scripts — the new-UI equivalent of the classic `isc.DynamicForm` inside
 * `isc.OBPopup`. A backend `responseActions` entry (e.g. `EAPM_Popup`) carries a
 * data-only list of field descriptors; a migrated script registers a builder via
 * `OB.Utilities.Action.set(...)` and calls `openDynamicForm({ fields })`, which
 * opens a dialog hosting those fields (reusing the standard parameter selectors)
 * and resolves with the collected values, or `null` when the user cancels.
 *
 * React-free on purpose (mirrors {@link ./dialogs}): it owns a singleton request
 * queue (one dialog at a time) that a React host (`ParameterDialogHost`)
 * subscribes to and fulfils, so the imperative API can be injected by the pure
 * `buildProcessScriptContext` while the renderer stays in the modal subtree.
 */

import { logger } from "@/utils/logger";

/** Server-vocabulary input type of a dynamic field (the classic popup emits these two). */
export type DynamicFormInputType = "TEXT" | "CHECK";

/** One field descriptor carried by the backend `actionData.processParameters`. */
export interface DynamicFormField {
  /** Form key and label of the field. */
  name: string;
  /** Input type: `TEXT` → text input, `CHECK` → checkbox. */
  inputType: DynamicFormInputType;
  /** Default text value for a `TEXT` field. */
  defaultText?: string;
  /** Default checked state for a `CHECK` field (`"Y"`/`"N"`). */
  defaultCheck?: string;
  /** Optional parameter id, echoed back on each collected value. */
  id?: string;
}

/** A value collected from the dialog form, echoing the field's id/type. */
export interface CollectedValue {
  id?: string;
  name: string;
  inputType: DynamicFormInputType;
  value: unknown;
}

/** Options accepted by {@link openParameterDialog}. */
export interface ParameterDialogOptions {
  title?: string;
  fields: DynamicFormField[];
}

/** A pending dynamic-form dialog awaiting the user's decision. */
export interface ParameterDialogRequest {
  id: number;
  title?: string;
  fields: DynamicFormField[];
  /** Resolves with the collected values, or `null` when cancelled/closed. */
  resolve: (values: CollectedValue[] | null) => void;
}

type Listener = () => void;

const queue: ParameterDialogRequest[] = [];
const listeners = new Set<Listener>();
let nextId = 1;

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

/** Subscribes a host to queue changes. Returns an unsubscribe function. */
export function subscribeParameterDialogs(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The first pending dialog, or `undefined` when the queue is empty. */
export function peekParameterDialog(): ParameterDialogRequest | undefined {
  return queue[0];
}

/** Resolves a specific dialog with the collected values (or `null`) and advances the queue. */
export function resolveParameterDialog(id: number, values: CollectedValue[] | null): void {
  const index = queue.findIndex((request) => request.id === id);
  if (index === -1) return;
  const [request] = queue.splice(index, 1);
  request.resolve(values);
  notify();
}

/**
 * Resolves and clears every pending dialog with `null` (cancel). Called when the
 * host unmounts (modal closed) so an awaiting script never hangs; `null` is the
 * safe default — it never submits the second handler.
 */
export function clearParameterDialogs(): void {
  if (queue.length === 0) return;
  const pending = queue.splice(0, queue.length);
  for (const request of pending) {
    request.resolve(null);
  }
  notify();
}

/**
 * Opens a dynamic parameter-form dialog and resolves with the collected values,
 * or `null` when cancelled. Resolves to `null` immediately when no host is
 * mounted, mirroring the dialog helpers' safe-default behaviour.
 */
export function openParameterDialog(options: ParameterDialogOptions): Promise<CollectedValue[] | null> {
  return new Promise<CollectedValue[] | null>((resolve) => {
    if (listeners.size === 0) {
      logger.warn("[parameterDialog] no host mounted; openDynamicForm auto-resolved to null");
      resolve(null);
      return;
    }
    queue.push({ id: nextId++, title: options.title, fields: options.fields ?? [], resolve });
    notify();
  });
}
