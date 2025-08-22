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
import type { ToolbarButtonMetadata } from "./types";
import { logger } from "@/utils/logger";
import { useTabContext } from "@/contexts/tab";
import { useSelectedRecords } from "@/hooks/useSelectedRecords";
import useFormFields from "@/hooks/useFormFields";
import { compileExpression } from "@/components/Form/FormView/selectors/BaseSelector";
import { useUserContext } from "@/hooks/useUserContext";
import type { ProcessButton } from "@/components/ProcessModal/types";

const toolbarCache = new Map<string, ToolbarButtonMetadata[]>();

export function useToolbar(windowId: string, tabId?: string) {
  const cacheKey = `${windowId}-${tabId || "default"}`;
  const [toolbar, setToolbar] = useState<ToolbarButtonMetadata[] | null>(() => toolbarCache.get(cacheKey) || null);
  const [loading, setLoading] = useState(!!windowId && !toolbarCache.has(cacheKey));
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

    const cachedData = toolbarCache.get(cacheKey);
    if (cachedData) {
      setToolbar(cachedData);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = (await Metadata.getToolbar()) as ToolbarButtonMetadata[];
      toolbarCache.set(cacheKey, data);
      setToolbar(data);
    } catch (error) {
      logger.warn(error);

      setError(error instanceof Error ? error : new Error("Failed to fetch toolbar"));
    } finally {
      setLoading(false);
    }
  }, [windowId, cacheKey]);

  const buttons: ToolbarButtonMetadata[] = useMemo(() => toolbar ?? [], [toolbar]);

  useEffect(() => {
    if (windowId) {
      fetchToolbar();
    }
  }, [windowId, fetchToolbar]);

  const clearCache = useCallback(() => {
    toolbarCache.delete(cacheKey);
  }, [cacheKey]);

  const refetch = useCallback(async () => {
    clearCache();
    await fetchToolbar();
  }, [clearCache, fetchToolbar]);

  return {
    loading,
    error,
    buttons,
    processButtons,
    refetch,
  };
}
