import { useTabContext } from "@/contexts/tab";
import type { EntityData, FormInitializationResponse } from "@workspaceui/api-client/src/api/types";
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

    for (const [key, { value, identifier }] of Object.entries(formInitialization.columnValues)) {
      const field = fieldsByColumnName?.[key];
      const newKey = field?.hqlName ?? key;

      acc[newKey] = value;

      if (identifier) {
        acc[`${newKey}$_identifier`] = identifier;
      } else if (value !== null && value !== undefined && value !== "") {
        acc[`${newKey}$_identifier`] = "";
      }
    }

    const processedParentData = { ...parentData };

    return { ...acc, ...processedParentData };
  }, [fieldsByColumnName, formInitialization, parentData]);

  return initialState;
};
