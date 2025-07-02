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
