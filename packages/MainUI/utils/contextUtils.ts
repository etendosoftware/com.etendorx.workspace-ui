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

import { CONTEXT_CONSTANTS } from "@workspaceui/api-client/src/api/copilot";

interface ContextItem {
  contextString: string;
}

interface BuildContextStringOptions {
  contextItems: ContextItem[];
  registersText: string;
}

export const buildContextString = ({ contextItems, registersText }: BuildContextStringOptions): string => {
  if (contextItems.length === 0) {
    return "";
  }

  const recordsData = contextItems.map((item) => item.contextString);
  const count = contextItems.length;

  return `${CONTEXT_CONSTANTS.TAG_START} (${count} ${registersText}):\n\n${recordsData.join("\n\n---\n\n")}${CONTEXT_CONSTANTS.TAG_END}`;
};
