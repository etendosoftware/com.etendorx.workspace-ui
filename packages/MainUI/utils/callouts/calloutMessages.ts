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

import type { StatusType } from "@workspaceui/componentlibrary/src/components/StatusModal/types";
import type { FormInitializationResponse } from "@workspaceui/api-client/src/api/types";
import { MESSAGE_BAR_TYPES } from "@/utils/processes/definition/messageBarStore";

export type CalloutMessage = NonNullable<FormInitializationResponse["calloutMessages"]>[number];

/**
 * Surfaces the `calloutMessages` a FIC change response returns (info/warning/success/error)
 * through the app's shared toast mechanism, one toast per message, in order.
 */
export function showCalloutMessages(
  messages: CalloutMessage[] | undefined,
  showStatusModal: (statusType: StatusType, statusText: string) => void
): void {
  if (!messages?.length) return;

  for (const message of messages) {
    if (!message?.text) continue;
    const statusType = (MESSAGE_BAR_TYPES[message.severity] ?? "info") as StatusType;
    showStatusModal(statusType, message.text);
  }
}
