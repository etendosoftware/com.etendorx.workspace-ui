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
import type { EntityData, EntityValue, FormInitializationResponse } from "@workspaceui/api-client/src/api/types";
import { getFieldsByColumnName } from "@workspaceui/api-client/src/utils/metadata";
import { useMemo } from "react";
import { FieldName } from "./types";
import useFormParent from "./useFormParent";

export const useFormInitialState = (formInitialization?: FormInitializationResponse | null) => {
  const { tab } = useTabContext();
  const parentData = useFormParent(FieldName.HQL_NAME);
  const fieldsByColumnName = useMemo(() => getFieldsByColumnName(tab), [tab]);

  const initialState = useMemo(() => {
    if (!formInitialization) return null;

    const acc = { ...formInitialization.sessionAttributes } as EntityData;

    for (const [key, { value }] of Object.entries(formInitialization.auxiliaryInputValues)) {
      const newKey = fieldsByColumnName?.[key]?.hqlName ?? key;

      acc[newKey] = value;
    }

    for (const [key, { value, identifier, entries }] of Object.entries(formInitialization.columnValues)) {
      const field = fieldsByColumnName?.[key];
      const newKey = field?.hqlName ?? key;

      acc[newKey] = value;

      if (entries) {
        acc[`${newKey}$_entries`] = entries.map((e) => ({ id: e.id, label: e._identifier })) as unknown as EntityValue;
      }

      if (identifier) {
        acc[`${newKey}$_identifier`] = identifier;
      } else if (value !== null && value !== undefined && value !== "") {
        acc[`${newKey}$_identifier`] = "";
      }
    }

    const processedParentData = { ...parentData };

    return { ...processedParentData, ...acc };
  }, [fieldsByColumnName, formInitialization, parentData]);

  return initialState;
};
