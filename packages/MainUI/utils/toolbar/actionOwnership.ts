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

import { type ToolbarActions, defaultActions } from "@/stores/toolbarStore";

/**
 * Components that register toolbar action implementations for a tab.
 *
 * Before split view only one of them could be on screen at a time, so a plain
 * "last write wins" merge was enough. With grid and form visible together their
 * registrations overlap, and React effect ordering decides the winner — which
 * silently disabled SAVE and skipped the form's unsaved-changes check.
 * Ownership makes the winner explicit and resolved at read time instead.
 */
export const TOOLBAR_ACTION_OWNERS = {
  FORM: "form",
  GRID: "grid",
  TAB: "tab",
} as const;

export type ToolbarActionOwner = (typeof TOOLBAR_ACTION_OWNERS)[keyof typeof TOOLBAR_ACTION_OWNERS];

/**
 * Highest priority first: a mounted form pane owns save/refresh/back/new, a
 * visible grid owns filter/columnFilters, and the tab owns everything else.
 */
export const TOOLBAR_OWNER_PRIORITY: readonly ToolbarActionOwner[] = [
  TOOLBAR_ACTION_OWNERS.FORM,
  TOOLBAR_ACTION_OWNERS.GRID,
  TOOLBAR_ACTION_OWNERS.TAB,
];

export type ToolbarActionsByOwner = Record<ToolbarActionOwner, Partial<ToolbarActions>>;

export const createEmptyActionsByOwner = (): ToolbarActionsByOwner => ({
  [TOOLBAR_ACTION_OWNERS.FORM]: {},
  [TOOLBAR_ACTION_OWNERS.GRID]: {},
  [TOOLBAR_ACTION_OWNERS.TAB]: {},
});

const findOwnedAction = <K extends keyof ToolbarActions>(
  byOwner: ToolbarActionsByOwner,
  action: K
): ToolbarActions[K] => {
  for (const owner of TOOLBAR_OWNER_PRIORITY) {
    const implementation = byOwner[owner]?.[action];
    if (implementation) {
      return implementation as ToolbarActions[K];
    }
  }
  return defaultActions[action];
};

/**
 * Flattens the per-owner buckets into the single action set the toolbar reads,
 * picking the highest-priority owner that provides each action.
 */
export const resolveToolbarActions = (byOwner: ToolbarActionsByOwner): ToolbarActions => {
  const resolved = {} as ToolbarActions;
  for (const action of Object.keys(defaultActions) as (keyof ToolbarActions)[]) {
    resolved[action] = findOwnedAction(byOwner, action) as never;
  }
  return resolved;
};
