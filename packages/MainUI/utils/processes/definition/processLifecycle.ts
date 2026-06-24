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
import type { CallerField } from "./scriptProxies";

/**
 * Decides whether the process-level lifecycle hooks (`onLoad` / `onProcess`)
 * should run for a given modal open.
 *
 * They run for any **top-level** open: launched from a window tab (a `tab` is
 * present) or as a **standalone menu process** (no tab, no launcher field). They
 * are skipped for **nested** modals — those opened by a script via
 * `view.openProcess`, which `ProcessStackHost` marks by forwarding a
 * `callerField`. This preserves the documented nested-modal behaviour while
 * fixing standalone menu processes, whose `onLoad` previously never ran because
 * the gate required a `tab` they don't have.
 *
 * @param params.tab - The window tab context, or `undefined` for menu/nested opens.
 * @param params.callerField - The forwarded launcher field; present only for nested opens.
 */
export function shouldRunProcessLifecycleHooks(params: {
  tab: Tab | undefined;
  callerField: CallerField | undefined;
}): boolean {
  if (params.tab) return true;
  return !params.callerField;
}
