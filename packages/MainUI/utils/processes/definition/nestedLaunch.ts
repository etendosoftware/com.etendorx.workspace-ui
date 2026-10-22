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

import type { Tab } from "@workspaceui/api-client/src/api/types";
import type Graph from "@/data/graph";
import type { OpenProcessLaunch } from "./processStack";
import type { OpenProcessParams, ViewData } from "./scriptProxies";

/** A process `onRefresh` hook (`view.onRefreshFunction`). */
type RefreshFunction = (view: unknown) => unknown;

/** What the launching modal contributes to a nested process launch. */
export interface NestedLauncher {
  windowId: string;
  viewData: ViewData;
  /** Tab and record the launching modal runs in (Classic `buttonOwnerView`). */
  ownerTab?: Tab;
  ownerRecord?: Record<string, unknown>;
  /** The launching modal's tab selection graph. */
  ownerGraph?: Graph<Tab>;
  /** The launching modal's `onRefresh` hook, used when the caller view has none. */
  onRefreshFunction?: RefreshFunction;
}

/**
 * Refreshes the view that launched a nested process after it succeeded, as
 * Classic does with `callerField.view.onRefreshFunction(callerField.view)`.
 * A view without its own hook (not a script view) falls back to the launching
 * modal's `onRefresh`.
 */
export function refreshLauncherView(view: unknown, fallback?: RefreshFunction): void {
  const ownRefresh = (view as { onRefreshFunction?: unknown } | undefined)?.onRefreshFunction;
  if (typeof ownRefresh === "function") {
    ownRefresh(view);
    return;
  }
  fallback?.(view);
}

/**
 * Builds the stack entry for `view.openProcess(params)`. The nested process
 * runs in the launcher's tab and record (Classic `buttonOwnerView`); its
 * `callerField` is the script's own (e.g. a grid row and its view) or the
 * launcher's; and only a successful execution refreshes the caller view, a
 * cancel does not.
 */
export function buildNestedLaunch(params: OpenProcessParams, launcher: NestedLauncher): OpenProcessLaunch {
  const callerField = params.callerField ?? launcher.viewData.callerField;
  const callerView = callerField?.view ?? launcher.viewData;
  return {
    ...params,
    windowId: params.windowId ?? launcher.windowId,
    callerField: { ...callerField, view: callerView },
    ownerTab: launcher.ownerTab,
    ownerRecord: launcher.ownerRecord,
    ownerGraph: launcher.ownerGraph,
    onSuccess: () => refreshLauncherView(callerView, launcher.onRefreshFunction),
  };
}
