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

import { useCallback, useState } from "react";
import type { Tab, EntityData, Field } from "@workspaceui/api-client/src/api/types";
import { FormMode } from "@workspaceui/api-client/src/api/types";
import {
  buildFormInitializationParams,
  buildFormInitializationPayload,
  buildSessionAttributes,
  fetchFormInitialization,
  mergeSessionAttributes,
} from "@/utils/hooks/useFormInitialization/utils";
import { clearRecordContextFromSession } from "@/utils/hooks/useTableSelection/sessionSync";
import { useTabContext } from "@/contexts/tab";
import useFormParent from "@/hooks/useFormParent";
import { buildFormInitialState } from "@/hooks/useFormInitialState";
import { FieldName } from "@/hooks/types";
import { useUserStore } from "@/stores/userStore";

interface UseInlineEditInitializationProps {
  tab: Tab;
}

interface InlineEditInitializationResult {
  /** `record` is the row being edited: its values go to the FIC as inp* fields, as the form view sends them. */
  fetchInitialData: (rowId: string, isNew: boolean, record?: EntityData) => Promise<EntityData | null>;
  loading: boolean;
  error: Error | null;
}

const findEntityKeyColumn = (fields: Tab["fields"]): Field | undefined =>
  Object.values(fields).find((field) => field?.column?.keyColumn);

/**
 * Fetches FormInitializationComponent data for a row edited inline. It follows the form view
 * (`useFormInitialization` + `useFormInitialState`): the root-tab session reset before NEW, the
 * record values in EDIT, the session merge and the same mapping of the response into values.
 */
export function useInlineEditInitialization({ tab }: UseInlineEditInitializationProps): InlineEditInitializationResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { parentRecord } = useTabContext();
  const setSession = useUserStore((s) => s.setSession);
  const parentDataByInputName = useFormParent(FieldName.INPUT_NAME);
  const parentDataByHqlName = useFormParent(FieldName.HQL_NAME);

  const fetchInitialData = useCallback(
    async (rowId: string, isNew: boolean, record?: EntityData): Promise<EntityData | null> => {
      setLoading(true);
      setError(null);

      try {
        const mode = isNew ? FormMode.NEW : FormMode.EDIT;
        const parentId = parentRecord?.id?.toString();
        const params = buildFormInitializationParams({
          tab,
          mode,
          recordId: isNew ? undefined : rowId,
          parentId,
        });

        const entityKeyColumn = findEntityKeyColumn(tab.fields);
        if (!entityKeyColumn) {
          throw new Error("Missing key column for form initialization");
        }

        const isRootTabCall = params.get("PARENT_ID") === "null";
        // Same as the form: wipe the record context a previously selected record left in the server
        // session, or its values leak into SQL defaults and callouts of the new row.
        if (isNew && isRootTabCall) {
          await clearRecordContextFromSession({ tab, parentId });
        }

        const payload = buildFormInitializationPayload(
          tab,
          mode,
          parentDataByInputName,
          entityKeyColumn,
          isNew ? null : record
        );
        const formInitialization = await fetchFormInitialization(params, payload);

        setSession((prev) => mergeSessionAttributes(prev, buildSessionAttributes(formInitialization), isRootTabCall));

        setLoading(false);
        return buildFormInitialState(formInitialization, tab, parentDataByHqlName);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch initialization data"));
        setLoading(false);
        return null;
      }
    },
    [tab, parentRecord, parentDataByInputName, parentDataByHqlName, setSession]
  );

  return {
    fetchInitialData,
    loading,
    error,
  };
}
