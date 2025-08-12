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
import { datasource } from "@workspaceui/api-client/src/api/datasource";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { useCallback, useState } from "react";
import { useFormContext } from "react-hook-form";
import { FieldName } from "./types";
import useFormParent from "./useFormParent";

export interface UseComboSelectParams {
  field: Field;
}

export const useComboSelect = ({ field }: UseComboSelectParams) => {
  const { watch, getValues } = useFormContext();
  const { tab } = useTabContext();
  const parentData = useFormParent(FieldName.INPUT_NAME);
  const windowId = tab.window;
  const value = watch(field.hqlName);
  const [records, setRecords] = useState<Record<string, string>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();

  const fetch = useCallback(
    async (_currentValue: typeof value) => {
      try {
        if (!field || !tab) {
          return;
        }

        setLoading(true);

        const body = new URLSearchParams({
          _startRow: "0",
          _endRow: "75",
          _operationType: "fetch",
          ...field.selector,
          moduleId: field.module,
          windowId,
          tabId: field.tab,
          inpTabId: field.tab,
          inpTableId: field.column.table,
          initiatorField: field.hqlName,
          ...(typeof _currentValue !== "undefined" ? { _currentValue } : {}),
          ...parentData,
        });

        for (const [key, value] of Object.entries(getValues())) {
          const _key = tab.fields[key]?.inputName;
          const stringValue = String(value);

          const valueMap = {
            true: "Y",
            false: "N",
            null: "null",
          };

          const safeValue = Object.prototype.hasOwnProperty.call(valueMap, stringValue)
            ? valueMap[stringValue as keyof typeof valueMap]
            : value;

          if (safeValue) {
            body.set(_key || key, safeValue);
          }
        }

        const { data, statusText } = await datasource.client.request(field.selector?.datasourceName ?? "", {
          method: "POST",
          body,
        });

        if (data?.response?.data) {
          setRecords(data.response.data);
        } else {
          throw new Error(statusText);
        }
      } catch (err) {
        logger.warn(err);

        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [field, getValues, parentData, tab, windowId]
  );

  return { records, loading, error, refetch: fetch };
};
