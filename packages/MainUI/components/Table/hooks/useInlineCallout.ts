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

import { useCallback, useRef } from "react";
import type { Field, FormInitializationResponse, Tab } from "@workspaceui/api-client/src/api/types";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { logger } from "@/utils/logger";
import { isDebugCallouts } from "@/utils/debug";
import { buildPayloadByInputName } from "@/utils";
import { getFieldsByColumnName } from "@workspaceui/api-client/src/utils/metadata";
import { globalCalloutManager } from "@/services/callouts";

const ACTION = "org.openbravo.client.application.window.FormInitializationComponent";
const MODE = "CHANGE";

export interface UseInlineCalloutProps {
  field: Field;
  tab: Tab;
  rowId: string;
  parentId?: string;
  session: Record<string, unknown>;
  currentRowData: Record<string, unknown>;
  onApplyCalloutValues: (columnValues: FormInitializationResponse["columnValues"]) => void;
}

/**
 * Hook for executing callouts in inline editing context
 * Adapted from useCallout to work with inline editing instead of react-hook-form
 */
export const useInlineCallout = ({
  field,
  tab,
  rowId,
  parentId = "null",
  session,
  currentRowData,
  onApplyCalloutValues,
}: UseInlineCalloutProps) => {
  const isExecutingCallout = useRef(false);
  const lastValue = useRef<unknown>(undefined);

  const executeCalloutRequest = useCallback(
    async (payload: Record<string, unknown>) => {
      const params = new URLSearchParams({
        _action: ACTION,
        MODE,
        TAB_ID: tab.id,
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
        return null;
      }
    },
    [tab.id, field.inputName, rowId, parentId]
  );

  const executeCallout = useCallback(
    async (newValue: unknown) => {
      // Don't execute if callout is not defined
      if (!field.column.callout) {
        return;
      }

      // Don't execute if value hasn't changed
      if (lastValue.current === newValue) {
        return;
      }

      // Don't execute if already executing
      if (isExecutingCallout.current) {
        if (isDebugCallouts()) {
          logger.debug(`[InlineCallout] Skipped (already executing): ${field.hqlName}`);
        }
        return;
      }

      // Don't execute if callouts are suppressed
      if (globalCalloutManager.isSuppressed()) {
        if (isDebugCallouts()) {
          logger.debug(`[InlineCallout] Skipped (suppressed): ${field.hqlName}`);
        }
        return;
      }

      try {
        isExecutingCallout.current = true;
        lastValue.current = newValue;

        if (isDebugCallouts()) {
          logger.debug(`[InlineCallout] Executing for field: ${field.hqlName}`, { newValue });
        }

        // Build payload with current row data
        const fieldsByHqlName = tab?.fields || {};
        const fieldsByColumnName = getFieldsByColumnName(tab);
        const payload = buildPayloadByInputName(currentRowData, fieldsByHqlName);

        const entityKeyColumn = tab.fields.id.columnName;
        const calloutData = {
          ...session,
          ...payload,
          inpKeyName: fieldsByColumnName[entityKeyColumn].inputName,
          inpTabId: tab.id,
          inpTableId: tab.table,
          inpkeyColumnId: entityKeyColumn,
          keyColumnName: entityKeyColumn,
          _entityName: tab.entityName,
          inpwindowId: tab.window,
        } as Record<string, unknown>;

        // Execute callout through global manager for proper queueing
        await globalCalloutManager.executeCallout(field.hqlName, async () => {
          const data = await executeCalloutRequest(calloutData);

          if (data?.columnValues) {
            // Suppress other callouts while applying values
            globalCalloutManager.suppress();
            try {
              if (isDebugCallouts()) {
                logger.debug(`[InlineCallout] Applying values for field: ${field.hqlName}`, data.columnValues);
              }
              onApplyCalloutValues(data.columnValues);
            } finally {
              // Resume after a short delay to allow state updates
              setTimeout(() => {
                globalCalloutManager.resume();
              }, 0);
            }
          }
        });
      } catch (error) {
        logger.error(`[InlineCallout] Error executing callout for ${field.hqlName}:`, error);
      } finally {
        isExecutingCallout.current = false;
      }
    },
    [field, tab, session, currentRowData, executeCalloutRequest, onApplyCalloutValues]
  );

  return executeCallout;
};
