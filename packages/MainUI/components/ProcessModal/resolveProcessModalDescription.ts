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
 * @fileoverview Resolves the descriptive text shown in the process modal header.
 *
 * Mirrors the classic UI criterion: a Report and Process (AD_Process, uipattern='S')
 * popup shows the process *Help* text in its info bar (see
 * org.openbravo.erpCommon/ad_actionButton/ActionButton<id>.html `#processHelp#`),
 * not the *Description*. Defined Processes (OBUIAPP_Process) keep showing their
 * description, so this criterion is scoped to Report and Process only.
 */

import { PROCESS_TYPES } from "@/utils/processes/definition/constants";
import type { ProcessDefinition } from "@workspaceui/api-client/src/api/types";

/**
 * Returns the text to display under the process modal title.
 *
 * For Report and Process, prefers `helpComment` (the classic Help field) and
 * falls back to `description` when Help is empty, so processes without Help
 * still show a meaningful header. For any other process type, returns the
 * `description` unchanged.
 *
 * @param processDefinition Process metadata holding `description`/`helpComment`.
 * @param type Process type discriminator (see {@link PROCESS_TYPES}).
 * @returns The resolved description text, or an empty string when none applies.
 */
export function resolveProcessModalDescription(
  processDefinition: Pick<ProcessDefinition, "description" | "helpComment">,
  type: string
): string {
  if (type === PROCESS_TYPES.REPORT_AND_PROCESS && processDefinition.helpComment) {
    return String(processDefinition.helpComment);
  }
  return String(processDefinition.description ?? "");
}
