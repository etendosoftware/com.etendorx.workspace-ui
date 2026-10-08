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

import type { Tab } from "@workspaceui/api-client/src/api/types";
import type { WindowState } from "@/utils/window/constants";

/** Shared fixtures for the tab and window navigation shortcut tests: a header with two child tabs. */

export const HEADER_TAB = { id: "header", tabLevel: 0 } as Tab;
export const LINES_TAB = { id: "lines", tabLevel: 1, parentTabId: HEADER_TAB.id } as Tab;
export const TAXES_TAB = { id: "taxes", tabLevel: 1, parentTabId: HEADER_TAB.id } as Tab;
export const WINDOW_TABS: Tab[] = [HEADER_TAB, LINES_TAB, TAXES_TAB];

export const makeWindow = (windowIdentifier: string, isActive = false) =>
  ({ windowIdentifier, isActive }) as WindowState;
