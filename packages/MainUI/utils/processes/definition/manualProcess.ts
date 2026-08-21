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

import type { ProcessDefinition, ProcessParameters } from "@workspaceui/api-client/src/api/types";
import { isManualProcess } from "./pickAndExecute";

/**
 * The parameters a process modal starts with.
 *
 * Etendo Classic never builds the parameter window for a Manual process. Its
 * `openProcess` (ob-standard-window.js) branches before `buildProcess`:
 *
 * ```js
 * if (params.uiPattern === 'M') {
 *   try { params.actionHandler(params, this); } catch (e) { isc.warn(e.message); }
 * } else {
 *   processToBeOpened = this.buildProcess(params);   // the parameter popup
 * }
 * ```
 *
 * So a Manual process's `OBUIAPP_Parameter` rows are dead metadata: the handler
 * *is* the process. Seeding them would render fields Classic never shows — e.g.
 * `SIIInvoiceSender` carries a "Warning" parameter whose default value is the
 * confirmation text, which the migrated script raises through `confirm()`.
 *
 * Dropping them at the seed (rather than at render time) also keeps them out of
 * the mandatory-parameter checks, so a dead mandatory parameter can never disable
 * the Execute button for reasons the user cannot see.
 *
 * Parameters injected at runtime by an `onLoad` hook (`_dynamicParameters`) are
 * unaffected: they are merged into the state after this seed, not read from the
 * process definition.
 */
export const initialProcessParameters = (process: ProcessDefinition | null | undefined): ProcessParameters => {
  if (!process || isManualProcess(process)) return {};
  return process.parameters ?? {};
};
