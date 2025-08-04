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

import { useCallback } from "react";
import type { Field, FormInitializationResponse } from "@workspaceui/api-client/src/api/types";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { FieldValues } from "react-hook-form";
import { logger } from "@/utils/logger";
import { useTabContext } from "@/contexts/tab";

export interface UseCalloutProps {
  field: Field;
  parentId?: string;
  rowId?: string;
}

const ACTION = "org.openbravo.client.application.window.FormInitializationComponent";
const MODE = "CHANGE";

export const useCallout = ({ field, parentId = "null", rowId = "null" }: UseCalloutProps) => {
  const { tab } = useTabContext();
  const tabId = tab?.id ?? "";

  return useCallback(
    async (payload: FieldValues) => {
      const params = new URLSearchParams({
        _action: ACTION,
        MODE,
        TAB_ID: tabId,
        CHANGED_COLUMN: field.inputName,
        ROW_ID: rowId,
        PARENT_ID: parentId,
      });

      try {
        const response = await Metadata.kernelClient.post(`?${params}`, payload);

        if (!response?.data) {
          throw new Error(`No data returned from callout for field "${field.inputName}".`);
        }

        return response.data as FormInitializationResponse;
      } catch (error) {
        logger.warn(`Error executing callout for field "${field.inputName}":`, error);
      }
    },
    [tabId, field.inputName, parentId, rowId]
  );
};
