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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { ToolbarButtonMetadata } from "./types";
import { logger } from "@/utils/logger";
import { useTabContext } from "@/contexts/tab";
import { useSelectedRecords } from "@/hooks/useSelectedRecords";
import useFormFields from "@/hooks/useFormFields";
import { compileExpression } from "@/components/Form/FormView/selectors/BaseSelector";
import { createSmartContext } from "@/utils/expressions";
import { useUserContext } from "@/hooks/useUserContext";
import type { ProcessButton } from "@/components/ProcessModal/types";
import { getWindowIdFromIdentifier } from "@/utils/window/utils";
import {
  fetchFormInitialization,
  buildFormInitializationPayload,
  buildFormInitializationParams,
} from "@/utils/hooks/useFormInitialization/utils";
import { FormMode } from "@workspaceui/api-client/src/api/types";

// NOTE: this need a fix in the future
// Save the same toolbar for the same windowIdentifier using the windowIdentifierentifier
// This is a problem because save multiple instances of the same toolbar
const toolbarCache = new Map<string, ToolbarButtonMetadata[]>();

/**
 * List of process column names that should NOT allow multiple selections
 * despite having isMultiRecord: true in metadata.
 *
 * These are processes that are incorrectly configured in the backend.
 * TODO: These should be fixed in Etendo Classic metadata by setting isMultiRecord = false
 */
const SINGLE_RECORD_ONLY_PROCESSES = new Set([
  "EM_APRM_AddPayment", // Add Payment - processes individual orders, not bulk
]);

export function useToolbar(windowIdentifier: string, tabId?: string) {
  const cacheKey = `${windowIdentifier}-${tabId || "default"}`;
  const [toolbar, setToolbar] = useState<ToolbarButtonMetadata[] | null>(() => toolbarCache.get(cacheKey) || null);
  const [loading, setLoading] = useState(!!windowIdentifier && !toolbarCache.has(cacheKey));
  const [error, setError] = useState<Error | null>(null);

  const { session } = useUserContext();
  const { tab, parentRecord, parentTab, auxiliaryInputs } = useTabContext();
  const selectedItems = useSelectedRecords(tab);
  const {
    fields: { actionFields },
  } = useFormFields(tab);

  // Toolbar-local auxiliary inputs fetched when a single record is selected in table view.
  // Kept separate from TabContext.auxiliaryInputs so it doesn't interfere with form view.
  const [toolbarAuxInputs, setToolbarAuxInputs] = useState<Record<string, string>>({});
  // Tracks the record ID for which toolbarAuxInputs was last fetched.
  const lastFetchedAuxIdRef = useRef<string | null>(null);

  const singleSelected = selectedItems.length === 1 ? selectedItems[0] : null;
  const singleSelectedId = singleSelected ? String(singleSelected.id) : null;

  // When exactly one record is selected, lazily fetch its auxiliary inputs so that
  // display logic expressions that reference context.* (e.g. context.APRM_OrderIsPaid)
  // can be evaluated correctly in both table view and form view.
  // In form view, TabContext.auxiliaryInputs (set by FormView) takes priority.
  useEffect(() => {
    // Already have fresh data for this record — nothing to do.
    if (singleSelectedId === lastFetchedAuxIdRef.current) return;

    // Record changed (or deselected): reset local aux inputs immediately so the
    // Classic === '' fallback applies during the async fetch.
    lastFetchedAuxIdRef.current = singleSelectedId;
    setToolbarAuxInputs({});

    if (!singleSelected || !singleSelectedId) return;

    // Only fetch if at least one process button has context-dependent display logic.
    const hasContextLogic = Object.values(actionFields).some((b) => b.displayLogicExpression?.includes("context."));
    if (!hasContextLogic) return;

    const entityKeyColumn = Object.values(tab.fields).find((f) => f?.column?.keyColumn);
    if (!entityKeyColumn) return;

    const params = buildFormInitializationParams({
      tab,
      mode: FormMode.EDIT,
      recordId: singleSelectedId,
      parentId: parentRecord?.id ? String(parentRecord.id) : null,
    });

    const payload = buildFormInitializationPayload(
      tab,
      FormMode.EDIT,
      {},
      entityKeyColumn,
      singleSelected as Record<string, unknown>
    );

    const capturedId = singleSelectedId;
    fetchFormInitialization(params, payload)
      .then((data) => {
        // Discard response if a different record was selected while fetching.
        if (lastFetchedAuxIdRef.current !== capturedId) return;
        const aux: Record<string, string> = {};
        for (const [key, { value }] of Object.entries(data.auxiliaryInputValues || {})) {
          aux[key] = value;
        }
        setToolbarAuxInputs(aux);
      })
      .catch((err) => logger.warn("Toolbar aux inputs fetch failed:", err));
  }, [singleSelectedId, singleSelected, actionFields, tab, parentRecord]);

  // Effective auxiliary inputs for display logic evaluation.
  // TabContext.auxiliaryInputs (form view / callouts) takes priority over the toolbar fetch.
  const effectiveAuxInputs = useMemo(
    () => ({ ...toolbarAuxInputs, ...auxiliaryInputs }),
    [toolbarAuxInputs, auxiliaryInputs]
  );

  const processButtons = useMemo(() => {
    const buttons = Object.values(actionFields) || [];
    return buttons.filter((button) => {
      if (!button.displayed) return false;
      if (selectedItems?.length === 0) return false;

      // Check if process allows multiple selections
      // Trust isMultiRecord from backend, but check exceptions list for misconfigured processes
      const isInExceptionList = SINGLE_RECORD_ONLY_PROCESSES.has(button.columnName);
      const allowsMultipleSelections = button?.processDefinition?.isMultiRecord && !isInExceptionList;

      if (selectedItems?.length > 1 && !allowsMultipleSelections) {
        return false;
      }
      if (!button.displayLogicExpression) return true;

      const compiledExpr = compileExpression(button.displayLogicExpression);
      try {
        const checkRecord = (record: Record<string, unknown>) => {
          const smartContext = createSmartContext({
            values: record,
            fields: tab.fields,
            auxiliaryInputs: effectiveAuxInputs,
            parentValues: parentRecord || undefined,
            parentFields: parentTab?.fields,
            context: session,
            defaultValue: "",
          });
          return compiledExpr(smartContext, smartContext);
        };

        // For multi-record processes: ALL selected records must satisfy the condition
        // For single-record processes: AT LEAST ONE record must satisfy the condition
        const result = allowsMultipleSelections ? selectedItems.every(checkRecord) : selectedItems.some(checkRecord);
        return result;
      } catch (error) {
        console.error(`Error evaluating displayLogic for ${button.columnName}:`, error);
        return true;
      }
    }) as ProcessButton[];
  }, [actionFields, selectedItems, session, tab, parentRecord, parentTab, effectiveAuxInputs]);

  const fetchToolbar = useCallback(async () => {
    if (!windowIdentifier) return;

    const cachedData = toolbarCache.get(cacheKey);
    const toolbarHasWindowsAttribute = cachedData?.some((button) => !!button.windows);
    if (cachedData && toolbarHasWindowsAttribute) {
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
  }, [windowIdentifier, cacheKey]);

  const buttons: ToolbarButtonMetadata[] = useMemo(() => {
    const windowId = getWindowIdFromIdentifier(windowIdentifier);
    const filteredButtons =
      toolbar?.filter((button) => {
        if (!button.windows || button.windows.length === 0) {
          return true;
        }
        return button.windows.some((window) => window.id === windowId);
      }) ?? [];
    return filteredButtons;
  }, [toolbar, windowIdentifier]);

  useEffect(() => {
    if (windowIdentifier) {
      fetchToolbar();
    }
  }, [windowIdentifier, fetchToolbar]);

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
