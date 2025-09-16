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

import { useTabContext } from "@/contexts/tab";
import { logger } from "@/utils/logger";
import {
  type FormInitializationParams,
  type FormInitializationResponse,
  FormMode,
  type Tab,
  type Field,
} from "@workspaceui/api-client/src/api/types";
import { useCallback, useMemo, useReducer } from "react";
import { FieldName } from "./types";
import useFormParent from "./useFormParent";
import { useUserContext } from "./useUserContext";
import { useCurrentRecord } from "./useCurrentRecord";
import {
  buildFormInitializationPayload,
  buildFormInitializationParams,
  fetchFormInitialization,
  buildSessionAttributes,
} from "@/utils/hooks/useFormInitialization/utils";
import type { RecordData, State, Action } from "@/utils/hooks/useFormInitialization/types";

/**
 * Initial state for the form initialization reducer
 */
const initialState: State = {
  loading: true,
  error: null,
  formInitialization: null,
};

/**
 * Reducer function to manage form initialization state
 * Handles loading, success, and error states during form initialization process
 *
 * @param state - Current state of the form initialization
 * @param action - Action to be processed containing type and optional payload
 * @returns Updated state based on the action type
 *
 */
const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "FETCH_START":
      return { loading: true, error: null, formInitialization: null };
    case "FETCH_SUCCESS":
      return { loading: false, error: null, formInitialization: action.payload };
    case "FETCH_ERROR":
      return { loading: false, error: action.payload, formInitialization: state.formInitialization };
    default:
      return state;
  }
};

export type useFormInitialization = State & {
  refetch: () => Promise<void>;
};

/**
 * Custom hook for managing form initialization in Etendo ERP forms
 *
 * This hook handles the complete lifecycle of form initialization including:
 * - Fetching form metadata and initial values
 * - Managing loading and error states
 * - Enriching data with audit fields
 * - Updating session attributes
 * - Providing refetch capability
 *
 * @param params - Form initialization parameters
 * @param params.tab - Tab configuration containing fields, entity info, etc.
 * @param params.mode - Form mode (NEW, EDIT, etc.)
 * @param params.recordId - Optional record ID for editing existing records
 *
 * @returns Object containing:
 * - `loading` - Boolean indicating if initialization is in progress
 * - `error` - Error object if initialization failed, null otherwise
 * - `formInitialization` - Initialized form data and configuration
 * - `refetch` - Function to re-trigger form initialization
 *
 */
export function useFormInitialization({ tab, mode, recordId }: FormInitializationParams): useFormInitialization {
  const { setSession, setSessionSyncLoading } = useUserContext();
  const { parentRecord: parent } = useTabContext();
  const [state, dispatch] = useReducer<React.Reducer<State, Action>>(reducer, initialState);
  const { error, formInitialization, loading } = state;
  const parentData = useFormParent(FieldName.HQL_NAME);
  const parentId = parent?.id?.toString();

  const { record } = useCurrentRecord({
    tab: tab,
    recordId: recordId,
  });

  const params = useMemo(
    () => (tab ? buildFormInitializationParams({ tab, mode, recordId, parentId }) : null),
    [tab, mode, recordId, parentId]
  );

  /**
   * Main fetch function that orchestrates the form initialization process
   *
   * This function:
   * 1. Validates required parameters and finds the entity key column
   * 2. Builds the payload with form data and parent context
   * 3. Fetches initialization data from the backend
   * 4. Enriches the response with audit fields for existing records
   * 5. Updates session attributes with the new data
   * 6. Dispatches success or error actions to update component state
   *
   * @throws {Error} When entity key column is missing or fetch fails
   */
  const fetch = useCallback(async () => {
    if (!params) return;

    try {
      setSessionSyncLoading(true);
      const entityKeyColumn = findEntityKeyColumn(tab.fields);
      if (!entityKeyColumn) throw new Error("Missing key column");

      const payload = buildFormInitializationPayload(tab, mode, parentData, entityKeyColumn);
      const data: FormInitializationResponse = await fetchFormInitialization(params, payload);

      const enrichedData = enrichWithAuditFields(data, record, mode);
      const storedInSessionAttributes = buildSessionAttributes(enrichedData);

      setSession((prev) => ({
        ...prev,
        ...storedInSessionAttributes,
      }));

      dispatch({ type: "FETCH_SUCCESS", payload: enrichedData });
    } catch (err) {
      logger.warn(err);
      dispatch({ type: "FETCH_ERROR", payload: err instanceof Error ? err : new Error("Unknown error") });
    } finally {
      setSessionSyncLoading(false);
    }
  }, [mode, params, parentData, setSession, tab, record]);

  /**
   * Finds the primary key column field in the tab's field configuration
   *
   * The key column is essential for form operations as it identifies the primary
   * key field used for record identification and database operations.
   *
   * @param fields - Object containing all field definitions for the current tab
   * @returns The field that represents the entity's primary key, or undefined if not found
   *
   */
  function findEntityKeyColumn(fields: Tab["fields"]): Field | undefined {
    return Object.values(fields).find((field) => field?.column?.keyColumn);
  }

  /**
   * Enriches form initialization data with audit trail information
   *
   * For existing records (non-NEW mode), this function adds audit fields
   * such as creation date, created by, last updated, and updated by information.
   * These fields are crucial for tracking record history and compliance.
   *
   * @param data - Original form initialization response from the backend
   * @param record - Current record data containing audit information
   * @param mode - Form mode to determine if audit fields should be added
   * @returns Enhanced form initialization data with audit fields included
   *
   */
  function enrichWithAuditFields(
    data: FormInitializationResponse,
    record: RecordData | null,
    mode: FormMode
  ): FormInitializationResponse {
    if (!record || mode === FormMode.NEW) return data;

    const auditFields = [
      { fieldName: "creationDate", value: record.creationDate, inputName: "inpcreationDate" },
      { fieldName: "createdBy$_identifier", value: record.createdBy$_identifier, inputName: "inpcreatedBy" },
      { fieldName: "updated", value: record.updated, inputName: "inpupdated" },
      { fieldName: "updatedBy$_identifier", value: record.updatedBy$_identifier, inputName: "inpupdatedBy" },
    ].filter(({ value }) => Boolean(value));

    for (const { fieldName, value } of auditFields) {
      if (!data.auxiliaryInputValues[fieldName]) {
        data.auxiliaryInputValues[fieldName] = { value: String(value) };
      }
      (data as unknown as Record<string, unknown>)[fieldName] = String(value);
    }

    return data;
  }

  /**
   * Refetch function to manually trigger form initialization
   *
   * Useful for refreshing form data after external changes or error recovery.
   * Resets the state to loading and re-runs the complete initialization process.
   *
   * @returns Promise that resolves when refetch is complete
   *
   */
  const refetch = useCallback(async () => {
    if (!params) return;
    dispatch({ type: "FETCH_START" });
    await fetch();
  }, [params, fetch]);

  return useMemo(
    () => ({ error, formInitialization, loading, refetch }) as useFormInitialization,
    [error, formInitialization, loading, refetch]
  );
}
