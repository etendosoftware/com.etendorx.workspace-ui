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

import { useCallback, useEffect, useMemo, useState } from "react";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { ToolbarButtonMetadata, ToolbarResponse } from "./types";
import { logger } from "@/utils/logger";
import { useTabContext } from "@/contexts/tab";
import { useSelectedRecords } from "@/hooks/useSelectedRecords";
import useFormFields from "@/hooks/useFormFields";
import { compileExpression } from "@/components/Form/FormView/selectors/BaseSelector";
import { useUserContext } from "@/hooks/useUserContext";
import type { ProcessButton } from "@/components/ProcessModal/types";

export function useToolbar(windowId: string, tabId?: string) {
  const [toolbar, setToolbar] = useState<ToolbarResponse | null>(null);
  const [loading, setLoading] = useState(!!windowId);
  const [error, setError] = useState<Error | null>(null);

  const { session } = useUserContext();
  const { tab } = useTabContext();
  const selectedItems = useSelectedRecords(tab);
  const {
    fields: { actionFields },
  } = useFormFields(tab);

  const processButtons = useMemo(() => {
    const buttons = Object.values(actionFields) || [];
    return buttons.filter((button) => {
      if (!button.displayed) return false;
      if (selectedItems?.length === 0) return false;
      if (selectedItems?.length > 1 && !button?.processDefinition?.isMultiRecord) return false;
      if (!button.displayLogicExpression) return true;

      const compiledExpr = compileExpression(button.displayLogicExpression);

      try {
        const checkRecord = (record: Record<string, unknown>) => compiledExpr(session, record);
        return button?.processDefinition?.isMultiRecord
          ? selectedItems.every(checkRecord)
          : selectedItems.some(checkRecord);
      } catch {
        return true;
      }
    }) as ProcessButton[];
  }, [actionFields, selectedItems, session]);

  const fetchToolbar = useCallback(async () => {
    if (!windowId) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("_operationType", "fetch");
      params.append("_startRow", "0");
      params.append("_endRow", "75");
      // params.append(
      //   'criteria',
      //   JSON.stringify({
      //     // Create a criteria that returns every recoord when tab id null and filter the records by tabId when it has one
      //   }),
      // );

      const url = tabId ? "etmeta_Toolbar" : `toolbar/${windowId}`;

      const response = await Metadata.datasourceServletClient.post(url, params, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      setToolbar(response.data);
    } catch (error) {
      logger.warn(error);

      setError(error instanceof Error ? error : new Error("Failed to fetch toolbar"));
    } finally {
      setLoading(false);
    }
  }, [windowId, tabId]);

  const buttons: ToolbarButtonMetadata[] = useMemo(() => toolbar?.response?.data ?? [], [toolbar]);

  useEffect(() => {
    if (windowId) {
      fetchToolbar();
    }
  }, [fetchToolbar, windowId]);

  return {
    loading,
    error,
    buttons,
    processButtons,
    refetch: fetchToolbar,
  };
}
