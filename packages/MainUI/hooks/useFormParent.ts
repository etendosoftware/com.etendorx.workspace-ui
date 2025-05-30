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
      const parentColumns = tab.parentColumns.map((field) => tab.fields[field]);
      const parentFields = getFieldsByInputName(parentTab);

      for (const field of parentColumns) {
        const parentField = parentFields[field.inputName];
        const parentFieldName = parentField.hqlName;

        result[field[nameToUse]] = parentRecord[parentFieldName];
      }
    }
    return result;
  }, [nameToUse, parentRecord, parentTab, tab]);
}
