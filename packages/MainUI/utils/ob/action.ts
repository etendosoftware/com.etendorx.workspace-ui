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

/** Error thrown by the not-yet-implemented `executeJSON` stub. */
export const ACTION_EXECUTE_JSON_DEFERRED = "OB.Utilities.Action.executeJSON is not implemented yet";

interface ActionEntry {
  name: string;
  action: ActionFn;
}

/**
 * Builds the `OB.Utilities.Action` namespace with a private registry. Because a
 * single `OB` instance is shared across a process modal's hooks (onLoad /
 * onProcess / onChange), an action registered by one hook is visible to the
 * others. Mirrors classic `set` / `execute`; `executeJSON` is not implemented yet.
 */
export function createAction(): OBAction {
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

  const executeJSON = (): never => {
    throw new Error(ACTION_EXECUTE_JSON_DEFERRED);
  };

  return { set, execute, executeJSON };
}
