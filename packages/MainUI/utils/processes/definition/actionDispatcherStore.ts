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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

/**
 * React-free singleton holding the active action-dispatch context. The process
 * modal registers the live side-effect handlers on mount and clears them on
 * unmount; the `OB.Utilities.Action.executeJSON` shim (built outside the React
 * tree) and the onProcess return path both route through this store, so there is
 * a single source of truth for how each classic action type becomes a side
 * effect. Mirrors the singleton pattern of the dialog / message-bar stores.
 */

import {
  type ActionDispatchContext,
  type DispatchedAction,
  dispatchResponseAction,
  dispatchResponseActions,
  dispatchSingle,
} from "@/components/ProcessModal/utils/responseActionDispatcher";
import { logger } from "@/utils/logger";

/**
 * Registered contexts, in mount order. A nested process modal registers on top of
 * its launcher; the active context is the topmost one, and closing the nested
 * modal gives the launcher its handlers back.
 */
const contexts: ActionDispatchContext[] = [];

/** Registers the modal's handlers as the active dispatch context, on top of the open ones. */
export function setActionDispatchContext(ctx: ActionDispatchContext): void {
  contexts.push(ctx);
}

/**
 * Removes `ctx` from the registered contexts, so the one below becomes active
 * again; a newer registration stays active. Without `ctx`, removes them all.
 */
export function clearActionDispatchContext(ctx?: ActionDispatchContext): void {
  if (!ctx) {
    contexts.length = 0;
  } else {
    const index = contexts.lastIndexOf(ctx);
    if (index !== -1) contexts.splice(index, 1);
  }
}

/** The active context, or `null` when no process modal is mounted. */
export function getActionDispatchContext(): ActionDispatchContext | null {
  return contexts.at(-1) ?? null;
}

/**
 * A context that always delegates to the one `getLatest` returns. A modal
 * registers it once, so its place in the stack does not change when its
 * handlers are rebuilt.
 */
export function delegateActionDispatchContext(getLatest: () => ActionDispatchContext): ActionDispatchContext {
  return new Proxy({} as ActionDispatchContext, {
    get: (_target, key) => getLatest()[key as keyof ActionDispatchContext],
  });
}

/**
 * Routes a single built-in action (`{ name: payload }`) to the active context.
 * Returns `false` when no modal is mounted or the type is unknown — matching the
 * classic dispatcher, which returns `false` for an unhandled action name.
 */
export function dispatchBuiltinAction(name: string, payload: unknown): boolean {
  const current = getActionDispatchContext();
  if (!current) {
    logger.warn("[ProcessModal] action dispatch with no active context:", name);
    return false;
  }
  const action = dispatchSingle({ [name]: payload });
  if (!action) return false;
  dispatchResponseAction(action, current);
  return true;
}

/**
 * Dispatches the actions returned by an onProcess execution, excluding the
 * `message` and `openDirectTab` kinds: those keep driving the existing
 * success/banner/navigation flow in the modal, so re-dispatching them here would
 * duplicate the effect. Everything else (refreshGrid, refreshGridParameter,
 * setSelectorValueFromRecord, report actions) takes effect through this pass.
 */
export function dispatchProcessReturnActions(rawData: unknown): void {
  const current = getActionDispatchContext();
  if (!current) return;
  for (const action of dispatchResponseActions(rawData)) {
    if (isHandledByLegacyFlow(action)) continue;
    dispatchResponseAction(action, current);
  }
}

/** Kinds the existing onProcess flow already handles (must not be re-dispatched). */
function isHandledByLegacyFlow(action: DispatchedAction): boolean {
  return action.kind === "message" || action.kind === "openDirectTab";
}
