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

import type { ProcessButton, ProcessResponse } from "@/components/ProcessModal/types";
import { logger } from "@/utils/logger";
import type { BaseFieldDefinition } from "@workspaceui/api-client/src/api/types";
import type { FieldType } from "@workspaceui/api-client/src/api/types";
import type { ExecuteProcessParams } from "./types";

export const useProcessButton = (
  executeProcess: (params: ExecuteProcessParams) => Promise<ProcessResponse>,
  refetch: () => Promise<void>
) => {
  const handleProcessClick = async (btn: ProcessButton, recordId: string | undefined): Promise<ProcessResponse> => {
    if (!recordId) {
      throw new Error("No record selected");
    }

    const processParams =
      Object.values(btn.processInfo?.parameters || {})?.reduce(
        (acc, param) => {
          acc[param.id] = param.defaultValue ?? null;
          return acc;
        },
        {} as Record<string, unknown>
      ) || {};

    const recordIdField: BaseFieldDefinition<string> = {
      value: recordId,
      type: "string" as FieldType,
      label: "Record ID",
      name: "recordId",
      original: {} as never,
    };

    try {
      const result = await executeProcess({
        button: btn,
        recordId: recordIdField,
        params: processParams,
      });

      if (result.refreshParent) {
        await refetch();
      }

      return result;
    } catch (error) {
      logger.warn("Error executing process", error);

      const message = error instanceof Error ? error?.message : "Unknown error occurred";

      return {
        responseActions: [
          {
            showMsgInProcessView: {
              msgType: "error",
              msgTitle: "Error",
              msgText: message,
            },
          },
        ],
      };
    }
  };

  return { handleProcessClick };
};
