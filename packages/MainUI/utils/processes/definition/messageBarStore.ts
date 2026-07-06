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
 * Singleton store for the in-modal message bar (`view.messageBar` /
 * `messageBar`). The classic UI shows a single sticky banner inside the process
 * modal: `setMessage(severity, title, text)` replaces the current message and
 * `hide()` clears it. This module owns that state (one message at a time, no
 * queue — unlike the dialog store) and a `ProcessMessageBar` React host
 * subscribes to it. Keeping it React-free lets the imperative handle be injected
 * by the pure `buildProcessScriptContext` while the banner lives in the modal.
 */

import type { MessageBarAction, MessageBarHandle } from "./scriptProxies";
import { sanitizeMessageHtml } from "./sanitizeHtml";

export type MessageBarSeverity = "info" | "success" | "warning" | "error";

/**
 * Classic `OB.MessageBar.TYPE_*` / `isc.OBMessageBar.TYPE_*` severity constants.
 * The values are the canonical severities, so a script passing one flows straight
 * through `normalizeSeverity` unchanged. Exposed on the `OB` and `isc` shims so
 * migrated scripts that reference these constants resolve them instead of throwing.
 */
export const MESSAGE_BAR_TYPES: Record<string, MessageBarSeverity> = {
  TYPE_INFO: "info",
  TYPE_SUCCESS: "success",
  TYPE_WARNING: "warning",
  TYPE_ERROR: "error",
};

/** The current message rendered by the banner, or `null` when hidden. */
export interface MessageBarState {
  severity: MessageBarSeverity;
  title: string | null;
  /** Already sanitized HTML, safe for `dangerouslySetInnerHTML`. */
  html: string;
  actions: MessageBarAction[];
}

type Listener = () => void;

const VALID_SEVERITIES: readonly MessageBarSeverity[] = ["info", "success", "warning", "error"];
const DEFAULT_SEVERITY: MessageBarSeverity = "info";

let current: MessageBarState | null = null;
const listeners = new Set<Listener>();

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

/** Maps an arbitrary severity input to a known severity (classic constants are lowercase). */
function normalizeSeverity(severity: string): MessageBarSeverity {
  const lower = String(severity).toLowerCase() as MessageBarSeverity;
  return VALID_SEVERITIES.includes(lower) ? lower : DEFAULT_SEVERITY;
}

/** Subscribes a host to message changes. Returns an unsubscribe function. */
export function subscribeMessageBar(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The current message state (or `null`). Snapshot for `useSyncExternalStore`. */
export function getMessageBarState(): MessageBarState | null {
  return current;
}

/** Replaces the current message with a sanitized one and notifies the host. */
function setMessage(severity: string, title: string | null, text: string, actions?: MessageBarAction[]): void {
  current = {
    severity: normalizeSeverity(severity),
    title: title ?? null,
    html: sanitizeMessageHtml(text ?? ""),
    actions: actions ?? [],
  };
  notify();
}

/** Clears the current message and notifies the host. */
function hide(): void {
  if (current === null) return;
  current = null;
  notify();
}

/**
 * The `messageBar` handle injected into the script context and the view proxy.
 * A stable singleton so the same banner is reached from every hook.
 */
export const messageBar: MessageBarHandle = { setMessage, hide };
