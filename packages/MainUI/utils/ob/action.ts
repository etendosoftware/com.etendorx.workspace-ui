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

import type { ActionFn, OBAction } from "./types";

/** Name of the built-in `custom` action (invokes `paramObj.func`). */
const CUSTOM_ACTION_NAME = "custom";

interface ActionEntry {
  name: string;
  action: ActionFn;
}

/** Dependencies wiring built-in action types to the host's side effects. */
export interface CreateActionDeps {
  /**
   * Routes a built-in action type (one not registered via `set`) to the host.
   * Returns `true` when the type was handled. Optional so the shim still builds
   * (and `executeJSON` degrades to registry-only) when no host is wired.
   */
  dispatchBuiltinAction?: (name: string, payload: unknown) => boolean;
}

/** Reads `payload.func` as a callable, or `undefined` when it is not a function. */
function getCustomFunction(payload: unknown): ActionFn | undefined {
  if (payload && typeof payload === "object" && typeof (payload as { func?: unknown }).func === "function") {
    return (payload as { func: ActionFn }).func;
  }
  return undefined;
}

/**
 * Builds the `OB.Utilities.Action` namespace with a private registry. Because a
 * single `OB` instance is shared across a process modal's hooks (onLoad /
 * onProcess / onChange), an action registered by one hook is visible to the
 * others. Mirrors classic `set` / `execute` / `executeJSON`: registered actions
 * win; otherwise built-in types are routed to the host via `dispatchBuiltinAction`.
 */
export function createAction(deps: CreateActionDeps = {}): OBAction {
  const registry: ActionEntry[] = [];

  const set = (name: string, action: ActionFn): boolean => {
    const index = registry.findIndex((entry) => entry.name === name);
    const entry: ActionEntry = { name, action };
    if (index >= 0) {
      registry[index] = entry;
    } else {
      registry.push(entry);
    }
    return true;
  };

  const execute = (name: string, params?: unknown, delay?: number): unknown => {
    if (typeof delay === "number") {
      setTimeout(() => execute(name, params), delay);
      return true;
    }
    const entry = registry.find((item) => item.name === name && typeof item.action === "function");
    return entry ? entry.action(params) : false;
  };

  // Seed the built-in `custom` action so registry-first dispatch covers it,
  // matching classic. Only the function form of `func` is supported; the
  // classic string-eval form is intentionally dropped (security).
  set(CUSTOM_ACTION_NAME, (params) => {
    const fn = getCustomFunction(params);
    if (fn) fn(params);
    return true;
  });

  /** Runs one `{ name: payload }` entry: registered action first, then built-in. */
  const dispatchEntry = (name: string, payload: unknown): void => {
    const isRegistered = registry.some((item) => item.name === name && typeof item.action === "function");
    if (isRegistered) {
      execute(name, payload);
      return;
    }
    deps.dispatchBuiltinAction?.(name, payload);
  };

  const executeJSON = (jsonArray: unknown, _threadId?: unknown, delay?: number, _processView?: unknown): boolean => {
    if (typeof delay === "number") {
      setTimeout(() => executeJSON(jsonArray), delay);
      return true;
    }
    const entries = Array.isArray(jsonArray) ? jsonArray : [jsonArray];
    for (const entry of entries) {
      if (!entry || typeof entry !== "object") continue;
      const [name, payload] = Object.entries(entry as Record<string, unknown>)[0] ?? [];
      if (name) dispatchEntry(name, payload);
    }
    return true;
  };

  return { set, execute, executeJSON };
}
