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
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import { getFieldsByInputName } from "@workspaceui/api-client/src/utils/metadata";
import { useMemo } from "react";
import { FieldName } from "./types";

export default function useFormParent(nameToUse: FieldName = FieldName.HQL_NAME) {
  const { tab, parentTab, parentRecord } = useTabContext();

  return useMemo(() => {
    const result = {} as EntityData;

    if (tab && parentTab && parentRecord) {
      const parentColumns = tab.parentColumns.map((field) => tab.fields[field]).filter(Boolean);
      const parentFields = getFieldsByInputName(parentTab);

      for (const field of parentColumns) {
        const parentField = parentFields[field.inputName];
        const parentFieldName = parentField?.hqlName;

        result[field[nameToUse]] = parentRecord[parentFieldName];
      }
    }
    return result;
  }, [nameToUse, parentRecord, parentTab, tab]);
}
